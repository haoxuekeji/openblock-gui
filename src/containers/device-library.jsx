import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'openblock-vm';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import {setDeviceData} from '../reducers/device-data';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

import {makeDeviceLibrary} from '../lib/libraries/devices/index.jsx';

import LibraryComponent from '../components/library/library.jsx';
import deviceIcon from '../components/action-menu/icon--sprite.svg';

// Legacy device ids encoded the transport as a separate device card. Keep
// their metadata for loading old projects, but expose only the canonical board
// and let the connection modal choose the transport.
const LEGACY_TRANSPORT_DEVICE_IDS = new Set([
    'microPythonEsp32Ble',
    'microPythonEsp32WebSerial',
    'microPythonEsp32C3Ble',
    'microPythonEsp32C3WebSerial'
]);

const messages = defineMessages({
    deviceTitle: {
        defaultMessage: 'Choose an Device',
        description: 'Heading for the device library',
        id: 'gui.deviceLibrary.chooseADevice'
    },
    deviceUrl: {
        defaultMessage: 'Enter the URL of the device',
        description: 'Prompt for unoffical device url',
        id: 'gui.deviceLibrary.deviceUrl'
    },
    arduinoTag: {
        defaultMessage: 'Arduino',
        description: 'Arduino tag to filter all arduino devices.',
        id: 'gui.deviceLibrary.arduinoTag'
    },
    microPythonTag: {
        defaultMessage: 'MicroPython',
        description: 'Micro python tag to filter all micro python devices.',
        id: 'gui.deviceLibrary.microPythonTag'
    },
    kitTag: {
        defaultMessage: 'Kit',
        description: 'Kit tag to filter all kit devices.',
        id: 'gui.deviceLibrary.kitTag'
    }
});

const ARDUINO_TAG = {tag: 'Arduino', intlLabel: messages.arduinoTag};
const MICROPYTHON_TAG = {tag: 'MicroPython', intlLabel: messages.microPythonTag};
const KIT_TAG = {tag: 'Kit', intlLabel: messages.kitTag};
const tagListPrefix = [ARDUINO_TAG, MICROPYTHON_TAG, KIT_TAG];

class DeviceLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'requestLoadDevice'
        ]);
    }

    componentDidMount () {
        this.props.vm.extensionManager.getDeviceList().then(data => {
            this.props.onSetDeviceData(makeDeviceLibrary(data));
        })
            .catch(() => {
                this.props.onSetDeviceData(makeDeviceLibrary());
            });
    }

    requestLoadDevice (device) {
        const id = device.deviceId;
        const deviceExtensions = device.deviceExtensions;

        if (id && !device.disabled) {
            if (this.props.vm.extensionManager.isDeviceLoaded(id)) {
                this.props.onDeviceSelected(id);
            } else {
                // Large device extensions take a while to download and
                // install, show a spinner alert until everything is in.
                this.props.onShowDeviceLoading();
                this.props.vm.extensionManager.loadDeviceURL(device)
                    .then(() => {
                        this.props.onDeviceSelected(id);
                        // installDeviceExtensions refreshes the extensions
                        // list itself before installing.
                        return this.props.vm.installDeviceExtensions(Object.assign([], deviceExtensions));
                    })
                    .then(() => {
                        this.props.onHideDeviceLoading();
                    })
                    .catch(() => {
                        this.props.onHideDeviceLoading();
                    });
            }
        }
    }

    handleItemSelect (item) {
        this.requestLoadDevice(item);
        this.props.onRequestClose();
    }

    render () {
        const deviceLibraryThumbnailData = this.props.deviceData
            .filter(device => !LEGACY_TRANSPORT_DEVICE_IDS.has(device.deviceId))
            .map(device => ({
                rawURL: device.iconURL || deviceIcon,
                ...device
            }));

        return (
            <LibraryComponent
                data={deviceLibraryThumbnailData}
                filterable
                tags={tagListPrefix}
                id="deviceLibrary"
                title={this.props.intl.formatMessage(messages.deviceTitle)}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

DeviceLibrary.propTypes = {
    deviceData: PropTypes.instanceOf(Array).isRequired,
    intl: intlShape.isRequired,
    onDeviceSelected: PropTypes.func,
    onHideDeviceLoading: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
    onSetDeviceData: PropTypes.func.isRequired,
    onShowDeviceLoading: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired // eslint-disable-line react/no-unused-prop-types
};

const mapStateToProps = state => ({
    deviceData: state.scratchGui.deviceData.deviceData
});

const mapDispatchToProps = dispatch => ({
    onSetDeviceData: data => dispatch(setDeviceData(data)),
    onShowDeviceLoading: () => dispatch(showStandardAlert('loadingDevice')),
    onHideDeviceLoading: () => dispatch(closeAlertWithId('loadingDevice'))
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(DeviceLibrary);
