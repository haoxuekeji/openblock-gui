import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {injectIntl, intlShape, defineMessages} from 'react-intl';

import PythonRunnerModalComponent from '../components/python-runner-modal/python-runner-modal.jsx';
import {closePythonRunnerModal} from '../reducers/modals';

const messages = defineMessages({
    connectError: {
        defaultMessage: 'Could not connect to OpenBlock Link. Make sure it is running, then try again.',
        description: 'Python runner failed to reach the local link service',
        id: 'gui.pythonRunner.connectError'
    },
    exited: {
        defaultMessage: '— program finished (exit code {code}) —',
        description: 'Python program exited by itself',
        id: 'gui.pythonRunner.exited'
    },
    killed: {
        defaultMessage: '— program stopped —',
        description: 'Python program was stopped by the user',
        id: 'gui.pythonRunner.killed'
    },
    installing: {
        defaultMessage: '— installing {name}… —',
        description: 'A pip install has started',
        id: 'gui.pythonRunner.installing'
    },
    installError: {
        defaultMessage: '— could not install: {error} —',
        description: 'A pip install was rejected',
        id: 'gui.pythonRunner.installError'
    }
});

/**
 * Websocket endpoint of the link python runner session.
 * Kept in sync with openblock-vm/src/util/scratch-link-websocket.js which
 * hardcodes the same host for the serialport session.
 */
const LINK_PYTHON_URL = 'ws://127.0.0.1:20111/openblock/python';

const CODE_STORAGE_KEY = 'pythonRunnerCode';
const DEFAULT_CODE = 'print("Hello, Python!")\n';

// Cap the terminal buffer so a busy print loop cannot grow memory forever.
const MAX_SEGMENTS = 1500;
const TRIMMED_SEGMENTS = 1000;

class PythonRunnerModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCancel',
            'handleClear',
            'handleCodeChange',
            'handleFileSelected',
            'handleInstall',
            'handleInstallChange',
            'handleRun',
            'handleSaveFile',
            'handleStdinChange',
            'handleStdinSend',
            'handleStop'
        ]);
        let savedCode = '';
        try {
            savedCode = window.localStorage.getItem(CODE_STORAGE_KEY) || '';
        } catch (e) {
            savedCode = '';
        }
        this.state = {
            code: savedCode || DEFAULT_CODE,
            connected: false,
            installValue: '',
            output: [],
            running: false,
            stdinValue: ''
        };
        this._ws = null;
        this._nextId = 0;
        this._pending = {};
        this._pid = null;
    }

    componentDidMount () {
        this.connect().catch(() => {
            this.appendOutput('system', `${this.props.intl.formatMessage(messages.connectError)}\n`);
        });
    }

    componentWillUnmount () {
        this.teardown();
    }

    teardown () {
        if (this._ws) {
            const ws = this._ws;
            this._ws = null;
            ws.onopen = ws.onclose = ws.onerror = ws.onmessage = null;
            try {
                // Server disposes the session and kills the program on close.
                ws.close();
            } catch (e) {
                // ignore
            }
        }
        this._pending = {};
    }

    connect () {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        this.teardown();
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(LINK_PYTHON_URL);
            this._ws = ws;
            ws.onopen = () => {
                this.setState({connected: true});
                resolve();
            };
            ws.onerror = () => {
                if (this._ws === ws) {
                    this.setState({connected: false, running: false});
                }
                reject(new Error('link connection failed'));
            };
            ws.onclose = () => {
                if (this._ws === ws) {
                    this._ws = null;
                    this.setState({connected: false, running: false});
                }
            };
            ws.onmessage = event => this.handleSocketMessage(event);
        });
    }

    rpc (method, params) {
        return new Promise((resolve, reject) => {
            if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
                reject(new Error('not connected'));
                return;
            }
            const id = ++this._nextId;
            this._pending[id] = {resolve, reject};
            this._ws.send(JSON.stringify({jsonrpc: '2.0', id, method, params}));
        });
    }

    handleSocketMessage (event) {
        let json;
        try {
            json = JSON.parse(event.data);
        } catch (e) {
            return;
        }
        if (json.method) {
            this.handleNotification(json.method, json.params || {});
            return;
        }
        const pending = this._pending[json.id];
        if (pending) {
            delete this._pending[json.id];
            if (json.error) {
                pending.reject(json.error);
            } else {
                pending.resolve(json.result);
            }
        }
    }

    handleNotification (method, params) {
        switch (method) {
        case 'stdout':
            this.appendOutput('stdout', params.data);
            break;
        case 'stderr':
            this.appendOutput('stderr', params.data);
            break;
        case 'started':
            this._pid = params.pid;
            this.setState({running: true});
            break;
        case 'exit': {
            // Restarting kills the previous process: ignore its late exit.
            if (params.pid && this._pid && params.pid !== this._pid) {
                break;
            }
            this._pid = null;
            this.setState({running: false});
            const text = params.signal || params.error ?
                this.props.intl.formatMessage(messages.killed) :
                this.props.intl.formatMessage(messages.exited, {code: `${params.code}`});
            this.appendOutput('system', `${text}\n`);
            break;
        }
        }
    }

    appendOutput (type, text) {
        if (!text) return;
        this.setState(state => {
            let output = state.output.concat({type, text});
            if (output.length > MAX_SEGMENTS) {
                output = output.slice(-TRIMMED_SEGMENTS);
            }
            return {output};
        });
    }

    handleRun () {
        const start = () => this.rpc('run', {code: this.state.code});
        this.connect()
            .then(start)
            .catch(() => {
                this.appendOutput('system', `${this.props.intl.formatMessage(messages.connectError)}\n`);
            });
    }

    handleStop () {
        this.rpc('stop', {}).catch(() => {});
    }

    handleClear () {
        this.setState({output: []});
    }

    handleCodeChange (event) {
        const code = event.target.value;
        this.setState({code});
        try {
            window.localStorage.setItem(CODE_STORAGE_KEY, code);
        } catch (e) {
            // storage may be unavailable; keep the code in memory only
        }
    }

    handleStdinChange (event) {
        this.setState({stdinValue: event.target.value});
    }

    handleInstallChange (event) {
        this.setState({installValue: event.target.value});
    }

    handleInstall () {
        const name = this.state.installValue.trim();
        if (!name) return;
        this.appendOutput('system', `${this.props.intl.formatMessage(messages.installing, {name})}\n`);
        this.setState({installValue: ''});
        this.connect()
            .then(() => this.rpc('pip', {packages: name.split(/\s+/)}))
            .catch(err => {
                const detail = (err && err.message) || `${err}`;
                this.appendOutput('system',
                    `${this.props.intl.formatMessage(messages.installError, {error: detail})}\n`);
            });
    }

    handleFileSelected (event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const code = `${reader.result}`;
            this.setState({code});
            try {
                window.localStorage.setItem(CODE_STORAGE_KEY, code);
            } catch (e) {
                // keep in memory only
            }
        };
        reader.readAsText(file);
    }

    handleSaveFile () {
        const blob = new Blob([this.state.code], {type: 'text/x-python'});
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'main.py';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    handleStdinSend () {
        const value = this.state.stdinValue;
        // Local echo: piped programs do not echo their stdin back.
        this.appendOutput('stdin', `${value}\n`);
        this.setState({stdinValue: ''});
        this.rpc('stdin', {data: `${value}\n`}).catch(() => {});
    }

    handleCancel () {
        this.props.onClose();
    }

    render () {
        return (
            <PythonRunnerModalComponent
                code={this.state.code}
                connected={this.state.connected}
                installValue={this.state.installValue}
                intl={this.props.intl}
                output={this.state.output}
                running={this.state.running}
                stdinValue={this.state.stdinValue}
                onCancel={this.handleCancel}
                onClear={this.handleClear}
                onCodeChange={this.handleCodeChange}
                onFileSelected={this.handleFileSelected}
                onInstall={this.handleInstall}
                onInstallChange={this.handleInstallChange}
                onRun={this.handleRun}
                onSaveFile={this.handleSaveFile}
                onStdinChange={this.handleStdinChange}
                onStdinSend={this.handleStdinSend}
                onStop={this.handleStop}
            />
        );
    }
}

PythonRunnerModal.propTypes = {
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closePythonRunnerModal())
});

export default compose(
    injectIntl,
    connect(mapStateToProps, mapDispatchToProps)
)(PythonRunnerModal);
