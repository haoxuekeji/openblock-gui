import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {SearchAddon} from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';

// Cap of the raw received-bytes log kept for "export log" (bytes).
const MAX_LOG_BYTES = 2 * 1024 * 1024;

// Cap of data queued while the terminal is paused (bytes).
const MAX_PAUSED_BYTES = 1024 * 1024;

const TERMINAL_THEME = {
    background: '#ffffff',
    foreground: '#575e75',
    cursor: '#575e75',
    cursorAccent: '#ffffff',
    selectionBackground: '#cce8ff'
};

/**
 * Singleton wrapper around an xterm.js terminal used as the hardware
 * console. The terminal instance and its DOM element survive React
 * mount/unmount cycles (e.g. switching between realtime and upload mode),
 * so the scrollback and the raw log are not lost. Incoming peripheral
 * data keeps being recorded even while the console UI is hidden.
 */
class HardwareTerminal {
    constructor () {
        this._terminal = null;
        this._fitAddon = null;
        this._searchAddon = null;
        this._container = null;
        this._host = null;
        this._resizeObserver = null;
        this._opened = false;

        this._vm = null;
        this._userDataHandler = null;
        this._onDataDisposable = null;

        this._paused = false;
        this._pausedChunks = [];
        this._pausedBytes = 0;

        this._logChunks = [];
        this._logBytes = 0;

        this._atLineStart = true;

        this._handlePeripheralData = this._handlePeripheralData.bind(this);
    }

    _ensureTerminal () {
        if (this._terminal) return;

        this._terminal = new Terminal({
            convertEol: false,
            cursorBlink: true,
            fontFamily: 'Menlo, Consolas, "DejaVu Sans Mono", monospace',
            fontSize: 12,
            scrollback: 5000,
            theme: TERMINAL_THEME
        });
        this._fitAddon = new FitAddon();
        this._searchAddon = new SearchAddon();
        this._terminal.loadAddon(this._fitAddon);
        this._terminal.loadAddon(this._searchAddon);

        // Keep Ctrl+C usable for copying when there is a selection,
        // otherwise let it through to the REPL as an interrupt.
        this._terminal.attachCustomKeyEventHandler(event => {
            if (event.type === 'keydown' &&
                event.ctrlKey && !event.shiftKey && !event.altKey &&
                (event.key === 'c' || event.key === 'C') &&
                this._terminal.hasSelection()) {
                const selection = this._terminal.getSelection();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(selection);
                }
                return false;
            }
            return true;
        });

        this._terminal.onData(data => {
            if (this._userDataHandler) {
                this._userDataHandler(data);
            }
        });

        this._container = document.createElement('div');
        this._container.style.width = '100%';
        this._container.style.height = '100%';
    }

    /**
     * Start recording peripheral data. Idempotent per vm instance; the
     * listener intentionally stays attached after the console unmounts so
     * output produced while the console is hidden is not lost.
     * @param {object} vm - the openblock-vm instance.
     */
    init (vm) {
        if (this._vm === vm) return;
        if (this._vm) {
            this._vm.removeListener('PERIPHERAL_RECIVE_DATA', this._handlePeripheralData);
        }
        this._vm = vm;
        vm.addListener('PERIPHERAL_RECIVE_DATA', this._handlePeripheralData);
    }

    _handlePeripheralData (data) {
        const bytes = data instanceof Uint8Array ? data : Uint8Array.from(data);
        this._appendLog(bytes);

        this._ensureTerminal();
        if (bytes.byteLength > 0) {
            this._atLineStart = bytes[bytes.byteLength - 1] === 0x0A;
        }
        if (this._paused) {
            this._pausedChunks.push(bytes);
            this._pausedBytes += bytes.byteLength;
            while (this._pausedBytes > MAX_PAUSED_BYTES && this._pausedChunks.length > 0) {
                this._pausedBytes -= this._pausedChunks.shift().byteLength;
            }
            return;
        }
        this._terminal.write(bytes);
    }

    _appendLog (bytes) {
        this._logChunks.push(bytes);
        this._logBytes += bytes.byteLength;
        while (this._logBytes > MAX_LOG_BYTES && this._logChunks.length > 0) {
            this._logBytes -= this._logChunks.shift().byteLength;
        }
    }

    /**
     * Show the terminal inside a host element. The terminal DOM node is
     * re-parented, not recreated, so the buffer content is preserved.
     * @param {HTMLElement} host - the element to render into.
     */
    attach (host) {
        this._ensureTerminal();
        this._host = host;
        host.appendChild(this._container);
        if (!this._opened) {
            this._terminal.open(this._container);
            this._opened = true;
        }
        this.fit();
        if (typeof ResizeObserver === 'function') {
            this._resizeObserver = new ResizeObserver(() => this.fit());
            this._resizeObserver.observe(host);
        }
    }

    /**
     * Remove the terminal from its host element, keeping its state.
     */
    detach () {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._host = null;
    }

    fit () {
        if (!this._opened || !this._host) return;
        try {
            this._fitAddon.fit();
        } catch (e) {
            // Host not measurable yet, a later resize will fit again.
        }
    }

    focus () {
        if (this._terminal) {
            this._terminal.focus();
        }
    }

    /**
     * Register the handler receiving user keystrokes (xterm onData).
     * @param {Function} handler - called with the input string.
     */
    onUserData (handler) {
        this._userDataHandler = handler;
    }

    offUserData () {
        this._userDataHandler = null;
    }

    /**
     * Freeze or resume the display. While paused incoming data is queued
     * (bounded) instead of dropped, and flushed on resume.
     * @param {boolean} paused - whether the terminal is paused.
     */
    setPaused (paused) {
        this._paused = paused;
        if (!paused && this._pausedChunks.length > 0) {
            this._ensureTerminal();
            this._pausedChunks.forEach(chunk => this._terminal.write(chunk));
            this._pausedChunks = [];
            this._pausedBytes = 0;
        }
    }

    /**
     * Write a dimmed system notice line, e.g. an upload separator. The
     * notice is a UI artifact, not received data, so it is excluded from
     * the raw export log.
     * @param {string} text - the line to display.
     */
    writeSystemLine (text) {
        this._ensureTerminal();
        const line = (this._atLineStart ? '' : '\r\n') +
            `\u001b[2m${text}\u001b[0m\r\n`;
        this._atLineStart = true;
        if (this._paused) {
            const bytes = new TextEncoder().encode(line);
            this._pausedChunks.push(bytes);
            this._pausedBytes += bytes.byteLength;
            while (this._pausedBytes > MAX_PAUSED_BYTES && this._pausedChunks.length > 0) {
                this._pausedBytes -= this._pausedChunks.shift().byteLength;
            }
            return;
        }
        this._terminal.write(line);
    }

    /**
     * Clear the terminal screen, its scrollback and the raw log.
     */
    clear () {
        if (this._terminal) {
            this._terminal.reset();
        }
        this._pausedChunks = [];
        this._pausedBytes = 0;
        this._logChunks = [];
        this._logBytes = 0;
        this._atLineStart = true;
    }

    findNext (term) {
        if (this._searchAddon && term) {
            this._searchAddon.findNext(term);
        }
    }

    findPrevious (term) {
        if (this._searchAddon && term) {
            this._searchAddon.findPrevious(term);
        }
    }

    /**
     * All raw bytes received since connect / last clear (bounded).
     * @return {Uint8Array} - the concatenated raw log.
     */
    exportLog () {
        const result = new Uint8Array(this._logBytes);
        let offset = 0;
        this._logChunks.forEach(chunk => {
            result.set(chunk, offset);
            offset += chunk.byteLength;
        });
        return result;
    }
}

let sharedTerminal = null;

/**
 * Get the shared hardware terminal instance.
 * @return {HardwareTerminal} - the singleton.
 */
const getHardwareTerminal = () => {
    if (!sharedTerminal) {
        sharedTerminal = new HardwareTerminal();
    }
    return sharedTerminal;
};

export default getHardwareTerminal;
