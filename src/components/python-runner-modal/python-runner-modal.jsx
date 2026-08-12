import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, intlShape, defineMessages} from 'react-intl';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import styles from './python-runner-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Python runner',
        description: 'Title of the local python runner modal',
        id: 'gui.pythonRunner.title'
    },
    codePlaceholder: {
        defaultMessage: 'Write Python code here…',
        description: 'Placeholder of the python code editor',
        id: 'gui.pythonRunner.codePlaceholder'
    },
    stdinPlaceholder: {
        defaultMessage: 'Type here and press Enter to send to the program',
        description: 'Placeholder of the program stdin field',
        id: 'gui.pythonRunner.stdinPlaceholder'
    }
});

const segmentStyle = {
    stderr: styles.terminalStderr,
    stdin: styles.terminalStdin,
    system: styles.terminalSystem
};

class PythonRunnerModalComponent extends React.Component {
    constructor (props) {
        super(props);
        this.setTerminalRef = this.setTerminalRef.bind(this);
        this.handleStdinSubmit = this.handleStdinSubmit.bind(this);
    }

    componentDidUpdate (prevProps) {
        if (prevProps.output !== this.props.output && this.terminal) {
            this.terminal.scrollTop = this.terminal.scrollHeight;
        }
    }

    setTerminalRef (el) {
        this.terminal = el;
    }

    handleStdinSubmit (event) {
        event.preventDefault();
        this.props.onStdinSend();
    }

    render () {
        const props = this.props;
        let statusNode;
        if (!props.connected) {
            statusNode = (
                <FormattedMessage
                    defaultMessage="OpenBlock Link is not connected"
                    description="Python runner cannot reach the local link service"
                    id="gui.pythonRunner.notConnected"
                />
            );
        } else if (props.running) {
            statusNode = (
                <FormattedMessage
                    defaultMessage="Running…"
                    description="A python program is currently running"
                    id="gui.pythonRunner.statusRunning"
                />
            );
        } else {
            statusNode = (
                <FormattedMessage
                    defaultMessage="Ready"
                    description="The python runner is idle"
                    id="gui.pythonRunner.statusReady"
                />
            );
        }
        return (
            <Modal
                className={styles.modalContent}
                contentLabel={props.intl.formatMessage(messages.title)}
                id="pythonRunnerModal"
                onRequestClose={props.onCancel}
            >
                <Box className={styles.body}>
                    <div className={styles.toolbar}>
                        <button
                            className={classNames(styles.button, styles.runButton)}
                            disabled={props.running}
                            onClick={props.onRun}
                        >
                            <FormattedMessage
                                defaultMessage="Run"
                                description="Run the python code on this computer"
                                id="gui.pythonRunner.run"
                            />
                        </button>
                        <button
                            className={classNames(styles.button, styles.stopButton)}
                            disabled={!props.running}
                            onClick={props.onStop}
                        >
                            <FormattedMessage
                                defaultMessage="Stop"
                                description="Stop the running python program"
                                id="gui.pythonRunner.stop"
                            />
                        </button>
                        <button
                            className={styles.button}
                            onClick={props.onClear}
                        >
                            <FormattedMessage
                                defaultMessage="Clear output"
                                description="Clear the python runner terminal"
                                id="gui.pythonRunner.clear"
                            />
                        </button>
                        <span
                            className={classNames(styles.status, {
                                [styles.statusRunning]: props.connected && props.running,
                                [styles.statusError]: !props.connected
                            })}
                        >
                            {statusNode}
                        </span>
                    </div>
                    <textarea
                        className={styles.editor}
                        placeholder={props.intl.formatMessage(messages.codePlaceholder)}
                        spellCheck={false}
                        value={props.code}
                        onChange={props.onCodeChange}
                    />
                    <div
                        className={styles.terminal}
                        ref={this.setTerminalRef}
                    >
                        {props.output.map((segment, index) => (
                            <span
                                className={segmentStyle[segment.type]}
                                key={index}
                            >
                                {segment.text}
                            </span>
                        ))}
                    </div>
                    <form
                        className={styles.stdinRow}
                        onSubmit={this.handleStdinSubmit}
                    >
                        <input
                            className={styles.stdinInput}
                            disabled={!props.running}
                            placeholder={props.intl.formatMessage(messages.stdinPlaceholder)}
                            type="text"
                            value={props.stdinValue}
                            onChange={props.onStdinChange}
                        />
                        <button
                            className={styles.button}
                            disabled={!props.running}
                            type="submit"
                        >
                            <FormattedMessage
                                defaultMessage="Send"
                                description="Send a line of input to the python program"
                                id="gui.pythonRunner.send"
                            />
                        </button>
                    </form>
                </Box>
            </Modal>
        );
    }
}

PythonRunnerModalComponent.propTypes = {
    code: PropTypes.string,
    connected: PropTypes.bool,
    intl: intlShape,
    onCancel: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    onCodeChange: PropTypes.func.isRequired,
    onRun: PropTypes.func.isRequired,
    onStdinChange: PropTypes.func.isRequired,
    onStdinSend: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    output: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string
    })),
    running: PropTypes.bool,
    stdinValue: PropTypes.string
};

export default PythonRunnerModalComponent;
