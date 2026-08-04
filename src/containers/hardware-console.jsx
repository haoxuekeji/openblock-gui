import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {intlShape, injectIntl, defineMessages} from 'react-intl';
import VM from 'openblock-vm';

import HardwareConsoleComponent from '../components/hardware-console/hardware-console.jsx';
import getHardwareTerminal from '../lib/hardware-terminal';
import downloadBlob from '../lib/download-blob';
import {DeviceType} from '../lib/device';

import {
    openSerialportMenu,
    closeSerialportMenu,
    serialportMenuOpen
} from '../reducers/menus';

import {showAlertWithTimeout} from '../reducers/alerts';
import {
    setBaudrate,
    setEol,
    switchHexForm,
    switchAutoScroll,
    switchPause,
    setDisplayMode,
    switchTimestamp,
    DISPLAY_MODE_TERMINAL,
    DISPLAY_MODE_MONITOR
} from '../reducers/hardware-console';
import {openBoardFilesModal} from '../reducers/modals';

const messages = defineMessages({
    noLineTerminators: {
        defaultMessage: 'No line terminators',
        description: 'no line terminators in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.noLineTerminators'
    },
    lineFeed: {
        defaultMessage: 'Line feed',
        description: 'Line feed in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.lineFeed'
    },
    carriageReturn: {
        defaultMessage: 'Carriage return',
        description: 'Carriage return in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.carriageReturn'
    },
    lfAndCr: {
        defaultMessage: 'LF & CR',
        description: 'LF & CR in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.lfAndCr'
    }
});

const baudrateList = [
    {key: '1200', value: 1200},
    {key: '2400', value: 2400},
    {key: '4800', value: 4800},
    {key: '9600', value: 9600},
    {key: '14400', value: 14400},
    {key: '19200', value: 19200},
    {key: '38400', value: 38400},
    {key: '57600', value: 57600},
    {key: '76800', value: 76800},
    {key: '115200', value: 115200},
    {key: '256000', value: 256000}
];

const eolList = [
    {key: 'null', value: messages.noLineTerminators},
    {key: 'lf', value: messages.lineFeed},
    {key: 'cr', value: messages.carriageReturn},
    {key: 'lfAndCr', value: messages.lfAndCr}
];

// Caps of the text kept in the monitor view. When the buffer grows past
// MAX_TEXT_LENGTH it is trimmed down to TRIM_TEXT_LENGTH at a line break,
// so multi-byte characters and lines are never cut in half.
const MAX_TEXT_LENGTH = 256 * 1024;
const TRIM_TEXT_LENGTH = 192 * 1024;

const HEX_BYTES_PER_LINE = 16;

// Throttle of the monitor view refresh.
const REFRESH_INTERVAL = 50;

// Minimum interval between "connect a peripheral first" alerts caused by
// typing into the terminal while nothing is connected.
const NOT_CONNECTED_ALERT_INTERVAL = 2000;

const MAX_SEND_HISTORY = 50;

const pad = (value, width) => String(value).padStart(width, '0');

const formatTimestamp = date =>
    `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:` +
    `${pad(date.getSeconds(), 2)}.${pad(date.getMilliseconds(), 3)}`;

class HardwareConsole extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleBaudrateApply',
            'handleBaudrateChange',
            'handleBaudrateKeyDown',
            'handleClickClean',
            'handleClickAutoScroll',
            'handleClickExport',
            'handleClickBoardFiles',
            'handleClickHardReset',
            'handleClickHexForm',
            'handleClickInterrupt',
            'handleClickPause',
            'handleClickSend',
            'handleClickSoftReset',
            'handleClickTimestamp',
            'handleClickToggleMode',
            'handleInputChange',
            'handleKeyPress',
            'handleKeyDown',
            'handleSearchChange',
            'handleSearchKeyDown',
            'handleSearchNext',
            'handleSearchPrev',
            'handleSelectEol',
            'handleTerminalInput',
            'handleUploadStarted',
            'handleUploadFinished',
            'handleUploadFailed',
            'onReciveData',
            'setTerminalRef',
            'writeToPeripheral'
        ]);
        this.state = {
            baudrateText: this.props.baudrate,
            consoleText: '',
            dataToSend: '',
            searchValue: ''
        };

        this._decoder = new TextDecoder('utf-8');
        this._textBuffer = '';
        this._atLineStart = true;

        this._hexLines = '';
        this._hexPending = [];
        this._hexOffset = 0;

        this._updateTimeoutID = null;

        this._sendHistory = [];
        this._historyIndex = -1;
        this._historyDraft = '';

        this._lastNotConnectedAlert = 0;
    }

    componentDidMount () {
        this.props.vm.addListener('PERIPHERAL_RECIVE_DATA', this.onReciveData);
        this.props.vm.addListener('PERIPHERAL_SET_UPLOAD_ABORT_ENABLED', this.handleUploadStarted);
        this.props.vm.addListener('PERIPHERAL_UPLOAD_SUCCESS', this.handleUploadFinished);
        this.props.vm.addListener('PERIPHERAL_UPLOAD_ERROR', this.handleUploadFailed);

        const terminal = getHardwareTerminal();
        terminal.init(this.props.vm);
        terminal.onUserData(this.handleTerminalInput);
        terminal.setPaused(this.props.isPause);

        if (this.props.peripheralName) {
            this.props.vm.setPeripheralBaudrate(this.props.deviceId, parseInt(this.props.baudrate, 10));
        }
    }

    componentDidUpdate (prevProps) {
        if (prevProps.isHexForm !== this.props.isHexForm) {
            this.refreshConsole();
        }
        // E.g. selecting another device rewrites the stored baudrate.
        if (prevProps.baudrate !== this.props.baudrate) {
            this.setState({baudrateText: this.props.baudrate}); // eslint-disable-line react/no-did-update-set-state
        }
    }

    componentWillUnmount () {
        this.props.vm.removeListener('PERIPHERAL_RECIVE_DATA', this.onReciveData);
        this.props.vm.removeListener('PERIPHERAL_SET_UPLOAD_ABORT_ENABLED', this.handleUploadStarted);
        this.props.vm.removeListener('PERIPHERAL_UPLOAD_SUCCESS', this.handleUploadFinished);
        this.props.vm.removeListener('PERIPHERAL_UPLOAD_ERROR', this.handleUploadFailed);
        if (this._updateTimeoutID) {
            clearTimeout(this._updateTimeoutID);
            this._updateTimeoutID = null;
        }
        getHardwareTerminal().offUserData();
    }

    getIsMicroPython () {
        const deviceType = this.props.deviceType;
        return deviceType === DeviceType.microPython || deviceType === DeviceType.microbit;
    }

    getEffectiveDisplayMode () {
        if (this.props.displayMode) {
            return this.props.displayMode;
        }
        return this.getIsMicroPython() ? DISPLAY_MODE_TERMINAL : DISPLAY_MODE_MONITOR;
    }

    onReciveData (data) {
        // Data keeps being buffered while paused, only the display refresh
        // is skipped, so no output is lost.
        this.appendText(data);
        this.appendHex(data);
        this.scheduleRefresh();
    }

    appendText (data) {
        let text = this._decoder.decode(data, {stream: true});
        if (text.length === 0) return;

        if (this.props.isTimestamp) {
            let out = '';
            for (let i = 0; i < text.length; i++) {
                const ch = text.charAt(i);
                if (this._atLineStart && ch !== '\r' && ch !== '\n') {
                    out += `[${formatTimestamp(new Date())}] `;
                    this._atLineStart = false;
                }
                out += ch;
                if (ch === '\n') {
                    this._atLineStart = true;
                }
            }
            text = out;
        } else {
            this._atLineStart = text.charAt(text.length - 1) === '\n';
        }

        this._textBuffer += text;
        if (this._textBuffer.length > MAX_TEXT_LENGTH) {
            let cut = this._textBuffer.length - TRIM_TEXT_LENGTH;
            const lineBreak = this._textBuffer.indexOf('\n', cut);
            if (lineBreak !== -1 && lineBreak + 1 < this._textBuffer.length) {
                cut = lineBreak + 1;
            }
            this._textBuffer = this._textBuffer.slice(cut);
        }
    }

    appendHex (data) {
        const bytes = data instanceof Uint8Array ? data : Uint8Array.from(data);
        for (let i = 0; i < bytes.length; i++) {
            this._hexPending.push(bytes[i]);
            if (this._hexPending.length === HEX_BYTES_PER_LINE) {
                this._hexLines += this.formatHexLine(this._hexOffset, this._hexPending);
                this._hexOffset += this._hexPending.length;
                this._hexPending = [];
            }
        }
        if (this._hexLines.length > MAX_TEXT_LENGTH) {
            let cut = this._hexLines.length - TRIM_TEXT_LENGTH;
            const lineBreak = this._hexLines.indexOf('\n', cut);
            if (lineBreak !== -1 && lineBreak + 1 < this._hexLines.length) {
                cut = lineBreak + 1;
            }
            this._hexLines = this._hexLines.slice(cut);
        }
    }

    formatHexLine (offset, lineBytes) {
        const hexColumn = lineBytes
            .map(b => b.toString(16)
                .padStart(2, '0')
                .toUpperCase())
            .join(' ')
            .padEnd((HEX_BYTES_PER_LINE * 3) - 1, ' ');
        const asciiColumn = lineBytes
            .map(b => ((b >= 0x20 && b <= 0x7E) ? String.fromCharCode(b) : '.'))
            .join('');
        return `${offset.toString(16).padStart(8, '0')}  ${hexColumn}  |${asciiColumn}|\n`;
    }

    composeHexText () {
        if (this._hexPending.length === 0) {
            return this._hexLines;
        }
        return this._hexLines + this.formatHexLine(this._hexOffset, this._hexPending);
    }

    scheduleRefresh () {
        if (this.props.isPause) return;
        if (!this._updateTimeoutID) {
            this._updateTimeoutID = setTimeout(() => {
                this._updateTimeoutID = null;
                this.refreshConsole();
            }, REFRESH_INTERVAL);
        }
    }

    refreshConsole () {
        this.setState({
            consoleText: this.props.isHexForm ? this.composeHexText() : this._textBuffer
        });
    }

    handleClickClean () {
        if (this.getEffectiveDisplayMode() === DISPLAY_MODE_TERMINAL) {
            getHardwareTerminal().clear();
            return;
        }
        this._decoder = new TextDecoder('utf-8');
        this._textBuffer = '';
        this._atLineStart = true;
        this._hexLines = '';
        this._hexPending = [];
        this._hexOffset = 0;
        this.setState({
            consoleText: ''
        });
    }

    handleClickPause () {
        const nextPaused = !this.props.isPause;
        getHardwareTerminal().setPaused(nextPaused);
        this.props.onSwitchPause();
        if (!nextPaused) {
            this.refreshConsole();
        }
    }

    handleKeyPress (e) {
        const keyCode = e.keyCode || e.which || e.charCode;

        // User pressed enter
        if (keyCode === 13) {
            this.handleClickSend();
        }
    }

    handleKeyDown (e) {
        const keyCode = e.keyCode || e.which || e.charCode;
        const ctrlKey = e.ctrlKey || e.metaKey;

        // Ctrl + A
        if (keyCode === 65 && ctrlKey) {
            e.preventDefault();
            this.writeToPeripheral(String.fromCharCode(1));
        }
        // Ctrl + B
        if (keyCode === 66 && ctrlKey) {
            e.preventDefault();
            this.writeToPeripheral(String.fromCharCode(2));
        }
        // Ctrl + C
        if (keyCode === 67 && ctrlKey) {
            e.preventDefault();
            this.writeToPeripheral(String.fromCharCode(3));
        }
        // Ctrl + D
        if (keyCode === 68 && ctrlKey) {
            e.preventDefault();
            this.writeToPeripheral(String.fromCharCode(4));
        }
        // Arrow up: recall an older entry of the send history.
        if (keyCode === 38) {
            e.preventDefault();
            if (this._sendHistory.length === 0) return;
            if (this._historyIndex === -1) {
                this._historyDraft = this.state.dataToSend;
                this._historyIndex = this._sendHistory.length - 1;
            } else if (this._historyIndex > 0) {
                this._historyIndex--;
            }
            this.setState({dataToSend: this._sendHistory[this._historyIndex]});
        }
        // Arrow down: back towards the newest entry / the current draft.
        if (keyCode === 40) {
            e.preventDefault();
            if (this._historyIndex === -1) return;
            if (this._historyIndex < this._sendHistory.length - 1) {
                this._historyIndex++;
                this.setState({dataToSend: this._sendHistory[this._historyIndex]});
            } else {
                this._historyIndex = -1;
                this.setState({dataToSend: this._historyDraft});
            }
        }
    }

    handleInputChange (e) {
        this._historyIndex = -1;
        this.setState({
            dataToSend: e.target.value
        });
    }

    writeToPeripheral (data) {
        if (this.props.peripheralName) {
            this.props.vm.writeToPeripheral(this.props.deviceId, data);
        } else {
            this.props.onNoPeripheralIsConnected();
        }
    }

    handleTerminalInput (data) {
        if (this.props.peripheralName) {
            this.props.vm.writeToPeripheral(this.props.deviceId, data);
            return;
        }
        // Every keystroke lands here, throttle the alert.
        const now = Date.now();
        if (now - this._lastNotConnectedAlert > NOT_CONNECTED_ALERT_INTERVAL) {
            this._lastNotConnectedAlert = now;
            this.props.onNoPeripheralIsConnected();
        }
    }

    handleClickSend () {
        const rawData = this.state.dataToSend;
        let data = rawData;
        if (this.props.eol === 'lf') {
            data = `${data}\n`;
        } else if (this.props.eol === 'cr') {
            data = `${data}\r`;
        } else if (this.props.eol === 'lfAndCr') {
            data = `${data}\r\n`;
        }
        this.writeToPeripheral(data);

        if (rawData.length > 0 &&
            this._sendHistory[this._sendHistory.length - 1] !== rawData) {
            this._sendHistory.push(rawData);
            if (this._sendHistory.length > MAX_SEND_HISTORY) {
                this._sendHistory.shift();
            }
        }
        this._historyIndex = -1;
        this._historyDraft = '';
        this.setState({dataToSend: ''});
    }

    handleClickInterrupt () {
        this.writeToPeripheral(String.fromCharCode(3));
    }

    handleClickSoftReset () {
        this.writeToPeripheral(String.fromCharCode(4));
    }

    handleClickHardReset () {
        if (!this.props.peripheralName) {
            this.props.onNoPeripheralIsConnected();
            return;
        }
        if (typeof this.props.vm.hardResetPeripheral === 'function') {
            this.props.vm.hardResetPeripheral(this.props.deviceId);
        }
    }

    /**
     * Append a system notice line, e.g. an upload separator, to both the
     * terminal (dimmed) and the monitor buffer.
     * @param {string} text - the notice text.
     */
    appendSystemLine (text) {
        const line = `--- ${text} ---`;
        getHardwareTerminal().writeSystemLine(line);

        if (this._textBuffer.length > 0 && !this._textBuffer.endsWith('\n')) {
            this._textBuffer += '\n';
        }
        this._textBuffer += `${line}\n`;
        this._atLineStart = true;
        this.scheduleRefresh();
    }

    handleUploadStarted (enabled) {
        if (enabled !== true) return;
        this.appendSystemLine(`Upload started ${formatTimestamp(new Date())}`);
    }

    handleUploadFinished (aborted) {
        this.appendSystemLine(aborted ?
            `Upload aborted ${formatTimestamp(new Date())}` :
            `Upload finished ${formatTimestamp(new Date())}`);
    }

    handleUploadFailed () {
        this.appendSystemLine(`Upload failed ${formatTimestamp(new Date())}`);
    }

    handleClickToggleMode () {
        const next = this.getEffectiveDisplayMode() === DISPLAY_MODE_TERMINAL ?
            DISPLAY_MODE_MONITOR : DISPLAY_MODE_TERMINAL;
        this.props.onSetDisplayMode(next);
    }

    handleClickExport () {
        const bytes = getHardwareTerminal().exportLog();
        const blob = new Blob([bytes], {type: 'text/plain'});
        const now = new Date();
        const name = `console-${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}` +
            `-${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(now.getSeconds(), 2)}.log`;
        downloadBlob(name, blob);
    }

    handleClickBoardFiles () {
        if (!this.props.peripheralName) {
            this.props.onNoPeripheralIsConnected();
            return;
        }
        if (typeof this.props.onOpenBoardFilesModal === 'function') {
            this.props.onOpenBoardFilesModal();
        }
    }

    handleClickTimestamp () {
        this.props.onSwitchTimestamp();
    }

    setTerminalRef (element) {
        const terminal = getHardwareTerminal();
        if (element) {
            terminal.attach(element);
            terminal.focus();
        } else {
            terminal.detach();
        }
    }

    handleSearchChange (e) {
        this.setState({searchValue: e.target.value});
    }

    handleSearchKeyDown (e) {
        const keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            e.preventDefault();
            if (e.shiftKey) {
                this.handleSearchPrev();
            } else {
                this.handleSearchNext();
            }
        }
    }

    handleSearchNext () {
        getHardwareTerminal().findNext(this.state.searchValue);
    }

    handleSearchPrev () {
        getHardwareTerminal().findPrevious(this.state.searchValue);
    }

    handleBaudrateChange (e) {
        this.setState({baudrateText: e.target.value});
    }

    handleBaudrateKeyDown (e) {
        const keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            e.preventDefault();
            this.handleBaudrateApply();
        }
    }

    /**
     * Validate the typed baudrate and apply it to the peripheral. Called
     * on enter and on blur; invalid input reverts to the current value.
     */
    handleBaudrateApply () {
        const value = parseInt(this.state.baudrateText, 10);
        if (isNaN(value) || value <= 0) {
            this.setState({baudrateText: this.props.baudrate});
            return;
        }
        const key = String(value);
        this.setState({baudrateText: key});
        if (key === this.props.baudrate) return;
        if (!this.props.peripheralName) {
            this.setState({baudrateText: this.props.baudrate});
            this.props.onNoPeripheralIsConnected();
            return;
        }
        this.props.onSetBaudrate(key);
        this.props.vm.setPeripheralBaudrate(this.props.deviceId, value);
    }

    handleSelectEol (e) {
        const index = e.target.selectedIndex;
        this.props.onSetEol(eolList[index].key);
    }

    handleClickHexForm () {
        this.props.onSwitchHexForm();
    }

    handleClickAutoScroll () {
        this.props.onSwitchAutoScroll();
    }

    render () {
        const isTerminalMode = this.getEffectiveDisplayMode() === DISPLAY_MODE_TERMINAL;
        return (
            <HardwareConsoleComponent
                baudrate={this.state.baudrateText}
                baudrateList={baudrateList}
                consoleText={this.state.consoleText}
                dataToSend={this.state.dataToSend}
                eol={this.props.eol}
                eolList={eolList}
                intl={this.props.intl}
                isAutoScroll={this.props.isAutoScroll}
                isHexForm={this.props.isHexForm}
                isMicroPython={this.getIsMicroPython()}
                isPause={this.props.isPause}
                isRtl={this.props.isRtl}
                isTerminalMode={isTerminalMode}
                isTimestamp={this.props.isTimestamp}
                searchValue={this.state.searchValue}
                serialportMenuOpen={this.props.serialportMenuOpen}
                supportsHardReset={Boolean(this.props.deviceId)}
                terminalRef={this.setTerminalRef}
                onBaudrateBlur={this.handleBaudrateApply}
                onBaudrateChange={this.handleBaudrateChange}
                onBaudrateKeyDown={this.handleBaudrateKeyDown}
                onClickClean={this.handleClickClean}
                onClickExport={this.handleClickExport}
                onClickBoardFiles={this.handleClickBoardFiles}
                onClickHardReset={this.handleClickHardReset}
                onClickInterrupt={this.handleClickInterrupt}
                onClickPause={this.handleClickPause}
                onClickAutoScroll={this.handleClickAutoScroll}
                onClickHexForm={this.handleClickHexForm}
                onClickSend={this.handleClickSend}
                onClickSerialportMenu={this.props.handleClickSerialportMenu}
                onClickSoftReset={this.handleClickSoftReset}
                onClickTimestamp={this.handleClickTimestamp}
                onClickToggleMode={this.handleClickToggleMode}
                onKeyPress={this.handleKeyPress}
                onKeyDown={this.handleKeyDown}
                onInputChange={this.handleInputChange}
                onRequestSerialportMenu={this.props.handleRequestSerialportMenu}
                onSearchChange={this.handleSearchChange}
                onSearchKeyDown={this.handleSearchKeyDown}
                onSearchNext={this.handleSearchNext}
                onSearchPrev={this.handleSearchPrev}
                onSelectEol={this.handleSelectEol}
            />
        );
    }
}

HardwareConsole.propTypes = {
    baudrate: PropTypes.string.isRequired,
    deviceId: PropTypes.string,
    deviceType: PropTypes.string,
    displayMode: PropTypes.string,
    eol: PropTypes.string.isRequired,
    handleClickSerialportMenu: PropTypes.func.isRequired,
    handleRequestSerialportMenu: PropTypes.func.isRequired,
    isAutoScroll: PropTypes.bool.isRequired,
    isHexForm: PropTypes.bool.isRequired,
    isPause: PropTypes.bool.isRequired,
    isTimestamp: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    onNoPeripheralIsConnected: PropTypes.func.isRequired,
    onOpenBoardFilesModal: PropTypes.func,
    onSetBaudrate: PropTypes.func.isRequired,
    onSetDisplayMode: PropTypes.func.isRequired,
    onSetEol: PropTypes.func.isRequired,
    onSwitchAutoScroll: PropTypes.func.isRequired,
    onSwitchHexForm: PropTypes.func.isRequired,
    onSwitchPause: PropTypes.func.isRequired,
    onSwitchTimestamp: PropTypes.func.isRequired,
    peripheralName: PropTypes.string,
    serialportMenuOpen: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    baudrate: state.scratchGui.hardwareConsole.baudrate,
    deviceId: state.scratchGui.device.deviceId,
    deviceType: state.scratchGui.device.deviceType,
    displayMode: state.scratchGui.hardwareConsole.displayMode,
    eol: state.scratchGui.hardwareConsole.eol,
    isAutoScroll: state.scratchGui.hardwareConsole.isAutoScroll,
    isHexForm: state.scratchGui.hardwareConsole.isHexForm,
    isPause: state.scratchGui.hardwareConsole.isPause,
    isTimestamp: state.scratchGui.hardwareConsole.isTimestamp,
    isRtl: state.locales.isRtl,
    peripheralName: state.scratchGui.connectionModal.peripheralName,
    serialportMenuOpen: serialportMenuOpen(state)
});

const mapDispatchToProps = dispatch => ({
    handleClickSerialportMenu: () => dispatch(openSerialportMenu()),
    handleRequestSerialportMenu: () => dispatch(closeSerialportMenu()),
    onNoPeripheralIsConnected: () => showAlertWithTimeout(dispatch, 'connectAPeripheralFirst'),
    onOpenBoardFilesModal: () => dispatch(openBoardFilesModal()),
    onSetBaudrate: baudrate => dispatch(setBaudrate(baudrate)),
    onSetDisplayMode: displayMode => dispatch(setDisplayMode(displayMode)),
    onSetEol: eol => dispatch(setEol(eol)),
    onSwitchAutoScroll: () => dispatch(switchAutoScroll()),
    onSwitchHexForm: () => dispatch(switchHexForm()),
    onSwitchPause: () => dispatch(switchPause()),
    onSwitchTimestamp: () => dispatch(switchTimestamp())
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(HardwareConsole);
