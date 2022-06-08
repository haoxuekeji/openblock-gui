import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'openblock-vm';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import SB3Downloader from './sb3-downloader.jsx';
import AlertComponent from '../components/alerts/alert.jsx';
import { openConnectionModal, openUploadProgress } from '../reducers/modals';
import { showAlertWithTimeout } from '../reducers/alerts';
import { manualUpdateProject } from '../reducers/project-state';

class Alert extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleOnCloseAlert',
            'handleUploadFirmware',
            'handleOnReconnect'
        ]);
    }
    handleOnCloseAlert() {
        this.props.onCloseAlert(this.props.index);
    }
    handleUploadFirmware () {
        if (this.props.deviceName) {
            this.props.vm.uploadFirmwareToPeripheral(this.props.deviceId);
            this.props.onOpenUploadProgress();
        } else {
            this.props.onNoPeripheralIsConnected();
        }
        this.handleOnCloseAlert();
    }
    handleOnReconnect() {
        this.props.onOpenConnectionModal();
        this.handleOnCloseAlert();
    }
    render() {
        const {
            closeButton,
            content,
            extensionName,
            extensionMessage,
            index, // eslint-disable-line no-unused-vars
            level,
            iconSpinner,
            iconURL,
            message,
            onSaveNow,
            showDownload,
            showUploadFirmware,
            showReconnect,
            showSaveNow
        } = this.props;
        return (
            <SB3Downloader>{(_, downloadProject) => (
                <AlertComponent
                    closeButton={closeButton}
                    content={content}
                    extensionName={extensionName}
                    extensionMessage={extensionMessage}
                    iconSpinner={iconSpinner}
                    iconURL={iconURL}
                    level={level}
                    message={message}
                    showDownload={showDownload}
                    showUploadFirmware={showUploadFirmware}
                    showReconnect={showReconnect}
                    showSaveNow={showSaveNow}
                    onCloseAlert={this.handleOnCloseAlert}
                    onDownload={downloadProject}
                    onReconnect={this.handleOnReconnect}
                    onUploadFirmware={this.handleUploadFirmware}
                    onSaveNow={onSaveNow}
                />
            )}</SB3Downloader>
        );
    }
}

const mapStateToProps = state => ({
    deviceId: state.scratchGui.device.deviceId,
    deviceName: state.scratchGui.device.deviceName
});

const mapDispatchToProps = dispatch => ({
    onOpenConnectionModal: () => {
        dispatch(openConnectionModal());
    },
    onOpenUploadProgress: () => dispatch(openUploadProgress()),
    onNoPeripheralIsConnected: () => showAlertWithTimeout(dispatch, 'connectAPeripheralFirst'),
    onSaveNow: () => {
        dispatch(manualUpdateProject());
    }
});

// const mapStateToProps = () => ({});

// const mapDispatchToProps = dispatch => ({
//     onOpenConnectionModal: id => {
//         dispatch(setConnectionModalExtensionId(id));
//         dispatch(openConnectionModal());
//     },
//     onSaveNow: () => {
//         dispatch(manualUpdateProject());
//     }
// });

Alert.propTypes = {
    closeButton: PropTypes.bool,
    content: PropTypes.element,
    deviceId: PropTypes.string,
    extensionName: PropTypes.string,
    extensionMessage: PropTypes.string,
    iconSpinner: PropTypes.bool,
    iconURL: PropTypes.string,
    index: PropTypes.number,
    level: PropTypes.string.isRequired,
    message: PropTypes.string,
    onCloseAlert: PropTypes.func.isRequired,
    onOpenConnectionModal: PropTypes.func,
    onOpenUploadProgress: PropTypes.func,
    onNoPeripheralIsConnected: PropTypes.func.isRequired,
    onSaveNow: PropTypes.func,
    deviceName: PropTypes.string,
    showDownload: PropTypes.bool,
    showUploadFirmware: PropTypes.bool,
    showReconnect: PropTypes.bool,
    showSaveNow: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Alert);
