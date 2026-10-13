import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import ConnectionModalComponent, {PHASES} from '../components/connection-modal/connection-modal.jsx';
import VM from 'openblock-vm';
// import analytics from '../lib/analytics';
import extensionData from '../lib/libraries/extensions/index.jsx';
import {isScratchDesktop} from '../lib/isScratchDesktop';

import {connect} from 'react-redux';
import {closeConnectionModal} from '../reducers/modals';
import {setConnectionModalPeripheralName, setListAll} from '../reducers/connection-modal';
import {setSupportSwitchMode} from '../reducers/program-mode';

const TRANSPORT_STORAGE_PREFIX = 'openblock.transport.';
// How long the "Connected" step stays up before the modal closes itself.
const CONNECTED_AUTO_CLOSE_MS = 900;

const isWebSerialSupported = () => (
    typeof navigator !== 'undefined' &&
    navigator.serial &&
    typeof navigator.serial.requestPort === 'function'
);

const isWebBluetoothSupported = () => (
    typeof navigator !== 'undefined' &&
    navigator.bluetooth &&
    typeof navigator.bluetooth.requestDevice === 'function'
);

const availableConnectionMethods = device => {
    if (!device || !device.connectionMethods) return [];
    const desktop = isScratchDesktop();
    return device.connectionMethods.filter(method => {
        if (desktop && method.browserOnly) return false;
        if (method.requiresWebSerial && !isWebSerialSupported()) return false;
        if (method.requiresWebBluetooth && !isWebBluetoothSupported()) return false;
        return true;
    });
};

/**
 * Whether this transport reaches the hardware through the local Link
 * service: the link method always does, and the BLE method does when the
 * browser has no Web Bluetooth (the vm then falls back to Link BLE).
 * Scan errors on these transports mean "Link is not running" and show
 * the install/start guidance instead of a generic error.
 * @param {?object} method - the selected connection method.
 * @return {boolean} - true when the transport goes through Link.
 */
const usesLinkService = method => !!method && (
    method.id === 'link' ||
    (method.id === 'webble' && !isWebBluetoothSupported())
);

/**
 * Whether a scan error on this device means "Link is not running". Devices
 * without a connectionMethods list (the Arduino boards and other legacy
 * devices) have no selected method and always go through Link.
 * @param {?object} method - the selected connection method.
 * @param {VM} vm - the vm, used to read the device's active transport.
 * @param {string} deviceId - the device or extension id.
 * @return {boolean} - true when the transport goes through Link.
 */
const isLinkTransport = (method, vm, deviceId) => {
    if (method) return usesLinkService(method);
    const transportId = vm && vm.getPeripheralTransport ? vm.getPeripheralTransport(deviceId) : null;
    return !transportId || usesLinkService({id: transportId});
};

const readPreferredTransport = deviceId => {
    try {
        return window.localStorage.getItem(`${TRANSPORT_STORAGE_PREFIX}${deviceId}`);
    } catch (e) {
        return null;
    }
};

const savePreferredTransport = (deviceId, transportId) => {
    try {
        window.localStorage.setItem(`${TRANSPORT_STORAGE_PREFIX}${deviceId}`, transportId);
    } catch (e) {
        // Storage may be unavailable in private/embedded browser contexts.
    }
};

class ConnectionModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSelectTransport',
            'handleChangeTransport',
            'handleScanning',
            'handleCancel',
            'handleConnected',
            'handleConnecting',
            'handleDisconnected',
            'handleDisconnect',
            'handleError',
            'handleHelp'
        ]);

        const device = this.findDevice();
        const methods = availableConnectionMethods(device);
        const activeTransportId = props.vm.getPeripheralTransport ?
            props.vm.getPeripheralTransport(props.deviceId) : null;
        const preferredTransportId = readPreferredTransport(props.deviceId);
        // A connection method chosen before is reused without asking again:
        // the modal opens straight on the scan (which, for Web Serial /
        // Web Bluetooth with a granted device, connects by itself). The
        // scanning step offers a link back to the method list.
        const preferredMethod = methods.find(method => method.id === preferredTransportId) || null;
        const selectedMethod = methods.find(method => method.id === activeTransportId) ||
            preferredMethod || methods[0] || null;
        const connected = props.vm.getPeripheralIsConnected(props.deviceId);
        this._skipTransportStep = !connected && methods.length > 1 && !!preferredMethod;

        this.state = {
            device,
            methods,
            selectedMethod: this._skipTransportStep ? preferredMethod : selectedMethod,
            preferredTransportId,
            phase: connected ? PHASES.connected :
                (methods.length > 1 && !this._skipTransportStep ? PHASES.selectingTransport : PHASES.scanning),
            peripheralName: null,
            errorMessage: null
        };
        this._autoCloseTimer = null;
    }

    componentDidMount () {
        this.props.vm.on('PERIPHERAL_CONNECTED', this.handleConnected);
        this.props.vm.on('PERIPHERAL_DISCONNECTED', this.handleDisconnected);
        this.props.vm.on('PERIPHERAL_CONNECTION_LOST_ERROR', this.handleError);
        this.props.vm.on('PERIPHERAL_REQUEST_ERROR', this.handleError);
        if (!this.props.vm.getPeripheralIsConnected(this.props.deviceId)) {
            if (this.state.methods.length === 1) {
                this.configureTransport(this.state.methods[0], false);
            } else if (this._skipTransportStep) {
                this.configureTransport(this.state.selectedMethod, false);
            }
        }
    }

    componentWillUnmount () {
        this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleConnected);
        this.props.vm.removeListener('PERIPHERAL_DISCONNECTED', this.handleDisconnected);
        this.props.vm.removeListener('PERIPHERAL_CONNECTION_LOST_ERROR', this.handleError);
        this.props.vm.removeListener('PERIPHERAL_REQUEST_ERROR', this.handleError);
        if (this._autoCloseTimer) {
            window.clearTimeout(this._autoCloseTimer);
            this._autoCloseTimer = null;
        }
    }

    findDevice () {
        return this.props.deviceData.find(device => device.deviceId === this.props.deviceId) ||
            extensionData.find(ext => ext.extensionId === this.props.deviceId);
    }

    configureTransport (method, remember = true) {
        if (!method) return;
        if (this.props.vm.setPeripheralTransport) {
            this.props.vm.setPeripheralTransport(this.props.deviceId, method.id);
        }
        if (remember) {
            savePreferredTransport(this.props.deviceId, method.id);
        }

        const programModes = method.programMode || [];
        const supportsRealtime = programModes.indexOf('realtime') !== -1;
        const supportsUpload = programModes.indexOf('upload') !== -1;
        this.props.onSetSupportSwitchMode(supportsRealtime && supportsUpload);
        if (!supportsRealtime) {
            this.props.vm.runtime.setRealtimeMode(false);
        } else if (!supportsUpload) {
            this.props.vm.runtime.setRealtimeMode(true);
        }
    }

    handleSelectTransport (event) {
        const transportId = event.currentTarget.getAttribute('data-transport-id');
        const method = this.state.methods.find(item => item.id === transportId);
        if (!method) return;
        try {
            this.configureTransport(method);
            this.setState({
                selectedMethod: method,
                preferredTransportId: transportId,
                phase: PHASES.scanning,
                errorMessage: null
            });
        } catch (error) {
            this.setState({
                phase: PHASES.error,
                errorMessage: error.message
            });
        }
    }

    handleScanning () {
        this.setState({
            phase: PHASES.scanning,
            errorMessage: null
        });
    }

    handleChangeTransport () {
        // Back to the method list from the scan; drop any half-open scan /
        // chooser state of the current transport first.
        try {
            if (!this.props.vm.getPeripheralIsConnected(this.props.deviceId)) {
                this.props.vm.disconnectPeripheral(this.props.deviceId);
            }
        } catch (e) {
            // Nothing to clean up.
        }
        this.setState({
            phase: PHASES.selectingTransport,
            errorMessage: null
        });
    }

    handleConnecting (peripheralId, peripheralName) {
        // Enter the connecting phase before starting the transport. Some
        // browser APIs can reject immediately; setting this afterwards would
        // overwrite the error phase and leave the modal stuck on "Connecting".
        this.setState({
            phase: PHASES.connecting,
            peripheralName,
            errorMessage: null
        }, () => {
            if (this.props.isRealtimeMode) {
                this.props.vm.connectPeripheral(this.props.deviceId, peripheralId);
            } else {
                this.props.vm.connectPeripheral(
                    this.props.deviceId,
                    peripheralId,
                    parseInt(this.props.baudrate, 10)
                );
            }
        });
        // analytics.event({
        //     category: 'devices',
        //     action: 'connecting',
        //     label: this.props.deviceId
        // });
    }

    handleDisconnected () {
        // Ignore cleanup events while already scanning/selecting/recovering.
        // BLE scan replacement used to emit a disconnect here and incorrectly
        // move the modal to a permanent "Connecting" phase.
        if (
            this.state.phase === PHASES.scanning ||
            this.state.phase === PHASES.selectingTransport ||
            this.state.phase === PHASES.error ||
            this.state.phase === PHASES.unavailable
        ) {
            return;
        }
        this.setState({
            phase: this.state.methods.length > 1 ? PHASES.selectingTransport : PHASES.scanning,
            errorMessage: null
        });
    }

    handleDisconnect () {
        try {
            this.props.vm.disconnectPeripheral(this.props.deviceId);
        } finally {
            this.props.onCancel();
        }
    }

    handleCancel () {
        try {
            // If we're not connected to a peripheral, close the active scan/channel.
            if (!this.props.vm.getPeripheralIsConnected(this.props.deviceId)) {
                this.props.vm.disconnectPeripheral(this.props.deviceId);
            }
        } finally {
            this.props.onCancel();
        }
    }

    handleError (err) {
        const usingLink = isLinkTransport(this.state.selectedMethod, this.props.vm, this.props.deviceId);
        if (usingLink && (this.state.phase === PHASES.scanning || this.state.phase === PHASES.unavailable)) {
            this.setState({
                phase: PHASES.unavailable,
                errorMessage: err.message
            });
        } else {
            this.setState({
                phase: PHASES.error,
                errorMessage: err.message
            });
            // analytics.event({
            //     category: 'devices',
            //     action: 'connecting error',
            //     label: this.props.deviceId
            // });
        }
    }

    handleConnected () {
        // Auto-scanning transports connect to the first advertising
        // peripheral without a click, so no name may have been handed in;
        // fall back to the device's own name so the menu bar never says
        // "Unconnected" over a live link.
        const deviceName = this.state.device && this.state.device.name;
        const peripheralName = this.state.peripheralName ||
            (typeof deviceName === 'string' ? deviceName : this.props.deviceId);
        this.setState({
            phase: PHASES.connected,
            peripheralName
        });
        // analytics.event({
        //     category: 'devices',
        //     action: 'connected',
        //     label: this.props.deviceId
        // });
        // The menu bar indicator follows the hardware device; a Scratch
        // extension peripheral connected alongside one keeps to its own
        // status button in the palette.
        if (this.props.isDeviceTarget) {
            this.props.onConnected(peripheralName);
        }
        // Show the success state briefly, then get out of the way: the
        // menu bar already reflects the link and "Go to Editor" was one
        // more click on every connection. Reopening the modal while
        // connected still lands on this step with the Disconnect button.
        if (this._autoCloseTimer) window.clearTimeout(this._autoCloseTimer);
        this._autoCloseTimer = window.setTimeout(() => {
            this._autoCloseTimer = null;
            if (this.props.vm.getPeripheralIsConnected(this.props.deviceId)) {
                this.props.onCancel();
            }
        }, CONNECTED_AUTO_CLOSE_MS);
    }

    handleHelp () {
        window.open(this.state.device.helpLink, '_blank');
        // analytics.event({
        //     category: 'devices',
        //     action: 'device help',
        //     label: this.props.deviceId
        // });
    }

    render () {
        const selectedMethod = this.state.selectedMethod;
        const isSerialport = selectedMethod ? selectedMethod.serialportRequired :
            (this.state.device && this.state.device.serialportRequired);

        return (
            <ConnectionModalComponent
                connectingMessage={this.state.device && this.state.device.connectingMessage}
                connectionIconURL={this.state.device && this.state.device.connectionIconURL}
                connectionSmallIconURL={this.state.device && this.state.device.connectionSmallIconURL}
                errorMessage={this.state.errorMessage}
                isSerialport={isSerialport}
                isListAll={this.props.isListAll}
                connectionTipIconURL={this.state.device && this.state.device.connectionTipIconURL}
                deviceId={this.props.deviceId}
                methods={this.state.methods}
                name={this.state.device && this.state.device.name}
                phase={this.state.phase}
                preferredTransportId={this.state.preferredTransportId}
                title={this.props.deviceId}
                useAutoScan={this.state.device && this.state.device.useAutoScan}
                vm={this.props.vm}
                onCancel={this.handleCancel}
                onConnected={this.handleConnected}
                onConnecting={this.handleConnecting}
                onClickListAll={this.props.onClickListAll}
                onDisconnect={this.handleDisconnect}
                onHelp={this.handleHelp}
                onScanning={this.handleScanning}
                onSelect={this.handleSelectTransport}
                canChangeTransport={this.state.methods.length > 1}
                onChangeTransport={this.handleChangeTransport}
            />
        );
    }
}

ConnectionModal.propTypes = {
    baudrate: PropTypes.string.isRequired,
    deviceId: PropTypes.string.isRequired,
    deviceData: PropTypes.instanceOf(Array).isRequired,
    isDeviceTarget: PropTypes.bool,
    isRealtimeMode: PropTypes.bool,
    isListAll: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onConnected: PropTypes.func.isRequired,
    onClickListAll: PropTypes.func.isRequired,
    onSetSupportSwitchMode: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => {
    const hardwareDeviceId = state.scratchGui.device.deviceId;
    // The peripheral this modal drives: a Scratch extension with its own
    // connection flow (e.g. wedo2) when one was targeted, otherwise the
    // selected hardware device.
    const deviceId = state.scratchGui.connectionModal.targetId || hardwareDeviceId;
    return {
        baudrate: state.scratchGui.hardwareConsole.baudrate,
        deviceData: state.scratchGui.deviceData.deviceData,
        deviceId,
        isDeviceTarget: !hardwareDeviceId || deviceId === hardwareDeviceId,
        isRealtimeMode: state.scratchGui.programMode.isRealtimeMode,
        isListAll: state.scratchGui.connectionModal.isListAll
    };
};

const mapDispatchToProps = dispatch => ({
    onCancel: () => {
        dispatch(closeConnectionModal());
    },
    onConnected: peripheralName => {
        dispatch(setConnectionModalPeripheralName(peripheralName));
    },
    onClickListAll: state => {
        dispatch(setListAll(state));
    },
    onSetSupportSwitchMode: state => {
        dispatch(setSupportSwitchMode(state));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ConnectionModal);

export {isLinkTransport};
