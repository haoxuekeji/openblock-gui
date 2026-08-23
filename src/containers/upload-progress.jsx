import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';

import { connect } from 'react-redux';
import { compose } from 'redux';
import { injectIntl, intlShape, defineMessages } from 'react-intl';

import VM from 'openblock-vm';
import analytics from '../lib/analytics';
import MessageBoxType from '../lib/message-box';
import { closeUploadProgress } from '../reducers/modals';
import { showAlertWithTimeout } from '../reducers/alerts';

import UploadProgressComponent, { PHASES } from '../components/upload-progress/upload-progress.jsx';

const messages = defineMessages({
    uploadErrorMessage: {
        defaultMessage: 'Upload error',
        description: 'Prompt for upload error',
        id: 'gui.uploadProgress.uploadErrorMessage'
    },
    uploadTimeout: {
        defaultMessage: 'Upload timeout',
        description: 'Prompt for upload timeout',
        id: 'gui.uploadProgress.uploadTimeoutMessage'
    },
    firmwareConfirm: {
        defaultMessage: 'The board does not respond. It may have no MicroPython firmware or the ' +
            'firmware is damaged. Reflash the firmware now? WARNING: this will erase all files ' +
            'stored on the board.',
        description: 'Ask the user to confirm reflashing the MicroPython firmware',
        id: 'gui.uploadProgress.firmwareConfirmMessage'
    }
});

const UPLOAD_TIMEOUT_TIME = 60 * 1000; // 60s
// After the user hit abort the vm normally answers within a few seconds
// with PERIPHERAL_UPLOAD_SUCCESS(aborted). A transport wedged in a
// never-settling operation (e.g. a Web Bluetooth GATT write on a dead
// link) can not answer at all - without a watchdog the modal would then
// keep both buttons disabled forever and only a page reload recovers.
const ABORT_TIMEOUT_TIME = 10 * 1000; // 10s
const AUTO_CLOSE_TIME = 3 * 1000; // 3s

class UploadProgress extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleAbort',
            'handleCancel',
            'handleConnectionLostError',
            'handleFirmwareConfirm',
            'handleHelp',
            'handleSetUploadAbortEnabled',
            'handleStdout',
            'handleUploadError',
            'handleUploadSuccess',
            'handleUploadTimeout',
            'handleStopAutoClose'
        ]);
        this.state = {
            extension: this.props.deviceData.find(dev => dev.deviceId === props.deviceId),
            phase: PHASES.uploading,
            peripheralName: null,
            abortEnabled: false,
            text: '',
            autoCloseCount: AUTO_CLOSE_TIME
        };
        // if the upload progress stack some seconds with out any info.
        // set state to timeout let user could colse the modal.
        this.uploadTimeout = setTimeout(() => this.handleUploadTimeout(), UPLOAD_TIMEOUT_TIME);
        // analytics.event({
        //     category: 'devices',
        //     action: 'uploading',
        //     label: this.props.deviceId
        // });
        this.scrollableRef = React.createRef();
    }
    componentDidMount() {
        this.props.vm.on('PERIPHERAL_UPLOAD_STDOUT', this.handleStdout);
        this.props.vm.on('PERIPHERAL_UPLOAD_ERROR', this.handleUploadError);
        this.props.vm.on('PERIPHERAL_CONNECTION_LOST_ERROR', this.handleConnectionLostError);
        this.props.vm.on('PERIPHERAL_UPLOAD_SUCCESS', this.handleUploadSuccess);
        this.props.vm.on('PERIPHERAL_SET_UPLOAD_ABORT_ENABLED', this.handleSetUploadAbortEnabled);
        this.props.vm.on('PERIPHERAL_UPLOAD_FIRMWARE_CONFIRM', this.handleFirmwareConfirm);
    }
    componentWillUnmount() {
        this.props.vm.removeListener('PERIPHERAL_UPLOAD_STDOUT', this.handleStdout);
        this.props.vm.removeListener('PERIPHERAL_UPLOAD_ERROR', this.handleUploadError);
        this.props.vm.removeListener('PERIPHERAL_CONNECTION_LOST_ERROR', this.handleConnectionLostError);
        this.props.vm.removeListener('PERIPHERAL_UPLOAD_SUCCESS', this.handleUploadSuccess);
        this.props.vm.removeListener('PERIPHERAL_SET_UPLOAD_ABORT_ENABLED', this.handleSetUploadAbortEnabled);
        this.props.vm.removeListener('PERIPHERAL_UPLOAD_FIRMWARE_CONFIRM', this.handleFirmwareConfirm);
        clearTimeout(this.uploadTimeout);
    }
    handleAbort () {
        this.props.vm.abortUploadToPeripheral(this.props.deviceId);
        // Re-arm (not clear) the watchdog: if the vm can not finish the
        // abort because the transport is stuck, the timeout phase still
        // unlocks the close button.
        clearTimeout(this.uploadTimeout);
        this.uploadTimeout = setTimeout(() => this.handleUploadTimeout(), ABORT_TIMEOUT_TIME);
        this.setState({abortEnabled: false});
    }
    handleCancel () {
        this.props.oncloseUploadProgress();
    }
    handleHelp() {
        window.open(this.state.extension.helpLink, '_blank');
        // analytics.event({
        //     category: 'devices',
        //     action: 'upload help',
        //     label: this.props.deviceId
        // });
    }
    handleStdout(data) {
        this.setState({
            text: this.state.text + data.message
        });
        this.scrollableRef.current.scrollToBottom();
        clearTimeout(this.uploadTimeout);
        this.uploadTimeout = setTimeout(() => this.handleUploadTimeout(), UPLOAD_TIMEOUT_TIME);
    }
    handleSetUploadAbortEnabled (enabled) {
        if (enabled) {
            this.setState({abortEnabled: true});
        } else {
            this.setState({abortEnabled: false});
        }
    }
    handleConnectionLostError (data) {
        this.setState({
            text: `${this.state.text + data.message} ${data.deviceId}\r\n`,
            phase: PHASES.error
        });
    }
    handleFirmwareConfirm (info) {
        // Reflashing erases every file on the board, so ask the user first.
        // Suspend the stdout-silence timeout while the question is open.
        clearTimeout(this.uploadTimeout);
        const confirmed = this.props.onShowMessageBox(MessageBoxType.confirm,
            this.props.intl.formatMessage(messages.firmwareConfirm));
        this.uploadTimeout = setTimeout(() => this.handleUploadTimeout(), UPLOAD_TIMEOUT_TIME);
        info.respond(Boolean(confirmed));
    }
    handleUploadError (data) {
        // if the upload progress has been in success don't handle the upload error.
        if (this.state.phase !== PHASES.success) {
            this.setState({
                text: `${this.state.text + data.message}\r\n` +
                    `${this.props.intl.formatMessage(messages.uploadErrorMessage)}\r\n`,
                phase: PHASES.error
            });
            this.props.onUploadError();
            // analytics.event({
            //     category: 'devices',
            //     action: 'upload error',
            //     label: this.props.deviceId
            // });
            clearTimeout(this.uploadTimeout);
        }
    }
    handleUploadSuccess (aborted) {
        // if be aborted, don't show success alert.
        if (aborted) {
            this.setState({
                phase: PHASES.aborted
            });
        } else {
            this.setState({
                phase: PHASES.success
            });
            this.props.onUploadSuccess();
        }
        this.autoCloseInterval = setInterval(() => {
            this.setState({
                autoCloseCount: this.state.autoCloseCount - 1000
            });
            if (this.state.autoCloseCount === 0) {
                clearInterval(this.autoCloseInterval);
                this.handleCancel();
            }
        }, 1000);

        clearTimeout(this.uploadTimeout);
    }
    handleUploadTimeout() {
        this.setState({
            text: `${this.state.text}\r\n${this.props.intl.formatMessage(messages.uploadTimeout)}`,
            phase: PHASES.timeout
        });
        this.props.onUploadError();
        // analytics.event({
        //     category: 'devices',
        //     action: 'upload timeout',
        //     label: this.props.deviceId
        // });
        clearTimeout(this.uploadTimeout);
    }
    handleStopAutoClose () {
        if (this.autoCloseInterval) {
            clearInterval(this.autoCloseInterval);
            this.setState({
                autoCloseCount: 0
            });
        }
    }

    render() {
        return (
            <UploadProgressComponent
                connectionSmallIconURL={this.state.extension && this.state.extension.connectionSmallIconURL}
                name={this.state.extension && this.state.extension.name}
                abortEnabled={this.state.abortEnabled}
                autoCloseCount={this.state.autoCloseCount}
                onAbort={this.handleAbort}
                onCancel={this.handleCancel}
                onHelp={this.handleHelp}
                onStopAutoClose={this.handleStopAutoClose}
                text={this.state.text}
                phase={this.state.phase}
                scrollableRef={this.scrollableRef}
            />
        );
    }
}

UploadProgress.propTypes = {
    deviceData: PropTypes.instanceOf(Array).isRequired,
    deviceId: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    oncloseUploadProgress: PropTypes.func.isRequired,
    onShowMessageBox: PropTypes.func.isRequired,
    onUploadError: PropTypes.func.isRequired,
    onUploadSuccess: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    deviceData: state.scratchGui.deviceData.deviceData,
    deviceId: state.scratchGui.device.deviceId
});

const mapDispatchToProps = dispatch => ({
    oncloseUploadProgress: () => dispatch(closeUploadProgress()),
    onUploadError: () => showAlertWithTimeout(dispatch, 'uploadError'),
    onUploadSuccess: () => showAlertWithTimeout(dispatch, 'uploadSuccess')
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(UploadProgress);
