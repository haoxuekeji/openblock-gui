import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'openblock-vm';


import {compose} from 'redux';
import {connect} from 'react-redux';

import {defineMessages, injectIntl, intlShape} from 'react-intl';

import extensionLibraryContent from '../lib/libraries/extensions/index.jsx';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    },
    extensionUrl: {
        defaultMessage: 'Enter the URL of the extension',
        description: 'Prompt for unoffical extension url',
        id: 'gui.extensionLibrary.extensionUrl'
    },
    shieldTag: {
        id: 'gui.library.shieldTag',
        defaultMessage: 'Shield',
        description: 'Shield tag to filter all shield libraries.'
    },
    actuatorTag: {
        id: 'gui.library.actuatorTag',
        defaultMessage: 'Actuator',
        description: 'Actuator tag to filter all actuator libraries.'
    },
    sensorTag: {
        id: 'gui.library.sensorTag',
        defaultMessage: 'Sensor',
        description: 'Sensor tag to filter all sensor libraries.'
    },
    displayTag: {
        id: 'gui.library.displayTag',
        defaultMessage: 'Display',
        description: 'Display tag to filter all display libraries.'
    },
    communicationTag: {
        id: 'gui.library.communicationTag',
        defaultMessage: 'Communication',
        description: 'Communication tag to filter all communication libraries.'
    },
    otherTag: {
        id: 'gui.library.otherTag',
        defaultMessage: 'Other',
        description: 'Other tag to filter all other libraries.'
    },
    stageTag: {
        id: 'gui.library.stageTag',
        defaultMessage: 'Stage',
        description: 'Stage tag to filter scratch extensions which run on the stage.'
    },
    deviceTag: {
        id: 'gui.library.deviceTag',
        defaultMessage: 'Device',
        description: 'Device tag to filter device extensions which run on the hardware device.'
    }
});

const SHIELD_TAG = {tag: 'shield', intlLabel: messages.shieldTag};
const ACTUATOR_TAG = {tag: 'actuator', intlLabel: messages.actuatorTag};
const SENSOR_TAG = {tag: 'sensor', intlLabel: messages.sensorTag};
const DISPLAY_TAG = {tag: 'display', intlLabel: messages.displayTag};
const COMMUNICATION_TAG = {tag: 'communication', intlLabel: messages.communicationTag};
const OTHER_TAG = {tag: 'other', intlLabel: messages.otherTag};
const tagListPrefix = [SHIELD_TAG, ACTUATOR_TAG, SENSOR_TAG, DISPLAY_TAG, COMMUNICATION_TAG, OTHER_TAG];

const STAGE_TAG = {tag: 'stage', intlLabel: messages.stageTag};
const DEVICE_TAG = {tag: 'device', intlLabel: messages.deviceTag};
const realtimeTagListPrefix = [STAGE_TAG, DEVICE_TAG];

// Device extensions declare the program modes they support via the
// `programMode` field. Legacy extensions without this field are upload-only.
const supportsProgramMode = (extension, mode) => {
    if (Array.isArray(extension.programMode) && extension.programMode.length > 0) {
        return extension.programMode.includes(mode);
    }
    return mode === 'upload';
};


class ExtensionLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'updateScratchExtensions',
            'updateDeviceExtensions',
            'handleItemSelect'
        ]);
        this.state = {
            scratchExtensions: [],
            deviceExtensions: []
        };
        this._mounted = false;
    }

    componentDidMount () {
        this._mounted = true;
        if (this.props.isRealtimeMode) {
            this.updateScratchExtensions();
            // Device extensions which declare realtime support are shown
            // alongside scratch extensions once a device is selected.
            if (this.props.deviceId) {
                this.updateDeviceExtensions();
            }
        } else {
            this.updateDeviceExtensions();
        }
    }

    componentWillUnmount () {
        this._mounted = false;
    }

    updateScratchExtensions () {
        this.props.vm.extensionManager.getExtensionsList(Object.assign([], extensionLibraryContent))
            .then(data => {
                if (this._mounted && data) {
                    this.setState({scratchExtensions: data});
                }
            });
    }

    updateDeviceExtensions () {
        this.props.vm.extensionManager.getDeviceExtensionsList()
            .then(data => {
                if (this._mounted && data) {
                    this.setState({deviceExtensions: data});
                }
            });
    }

    handleItemSelect (item) {
        const id = item.extensionId;

        // Device extension items carry the `isDeviceExtension` flag, so the
        // choice of loader no longer depends on the current program mode.
        if (item.isDeviceExtension) {
            if (id && !item.disabled) {
                if (this.props.vm.extensionManager.isDeviceExtensionLoaded(id)) {
                    this.props.vm.extensionManager.unloadDeviceExtension(id);
                    this.updateDeviceExtensions();
                } else {
                    this.props.vm.extensionManager.loadDeviceExtension(id).then(() => {
                        this.updateDeviceExtensions();
                        // analytics.event({
                        //     category: 'extensions',
                        //     action: 'select device extension',
                        //     label: id
                        // });
                    })
                        .catch(err => {
                            // TODO add a alet device extension load failed. and change the state to bar to failed state
                            console.error(err); // eslint-disable-line no-console
                        });
                }
            }
            return;
        }

        let url = item.extensionURL ? item.extensionURL : id;
        if (!item.disabled && !id) {
            // eslint-disable-next-line no-alert
            url = prompt(this.props.intl.formatMessage(messages.extensionUrl));
        }
        if (id && !item.disabled) {
            if (this.props.vm.extensionManager.isExtensionLoaded(url)) {
                this.props.vm.extensionManager.unloadExtension(url);
                this.updateScratchExtensions();
            } else {
                this.props.vm.extensionManager.loadExtensionURL(url).then(() => {
                    this.props.onCategorySelected(id);
                    // analytics.event({
                    //     category: 'extensions',
                    //     action: 'select extension',
                    //     label: id
                    // });
                    this.updateScratchExtensions();
                });
            }
        }
    }
    render () {
        let extensionLibraryThumbnailData = [];
        const device = this.props.deviceData.find(dev => dev.deviceId === this.props.deviceId);
        const supportsCurrentDevice = extension => {
            if (!extension.supportDevice) {
                return true;
            }
            if (!this.props.deviceId) {
                return false;
            }
            return extension.supportDevice.includes(this.props.deviceId) ||
                (device && extension.supportDevice.includes(device.deviceExtensionsCompatible)) ||
                extension.supportDevice.includes('*');
        };
        // Extensions whose blocks are already covered by the built-in device
        // categories declare `hiddenForDevices`; hide them from the library
        // for those devices. Loading by id (e.g. opening old projects that
        // used them) is not affected by this filter.
        const hiddenForCurrentDevice = extension => {
            if (!Array.isArray(extension.hiddenForDevices)) {
                return false;
            }
            return extension.hiddenForDevices.includes(this.props.deviceId) ||
                (device && extension.hiddenForDevices.includes(device.deviceExtensionsCompatible));
        };
        const filterAndSort = extensions => extensions.filter(supportsCurrentDevice)
            .filter(extension => !hiddenForCurrentDevice(extension))
            .map(extension => ({
                rawURL: extension.iconURL || extensionIcon,
                ...extension
            }))
            .sort((a, b) => {
                if ((b.isLoaded !== true) && (a.isLoaded === true)) return -1;
                return 1;
            });

        let tags;
        if (this.props.isRealtimeMode) {
            const stageExtensions = this.state.scratchExtensions.map(extension => ({
                ...extension,
                tags: [...(extension.tags || []), STAGE_TAG.tag]
            }));
            // Only device extensions which declare realtime support are usable
            // in realtime mode; without a selected device none are shown.
            const realtimeDeviceExtensions = this.props.deviceId ?
                this.state.deviceExtensions
                    .filter(extension => supportsProgramMode(extension, 'realtime'))
                    .map(extension => ({
                        ...extension,
                        isDeviceExtension: true,
                        tags: [...(extension.tags || []), DEVICE_TAG.tag]
                    })) :
                [];
            const visibleDeviceExtensions = filterAndSort(realtimeDeviceExtensions);
            extensionLibraryThumbnailData = [
                ...filterAndSort(stageExtensions),
                ...visibleDeviceExtensions
            ];
            tags = visibleDeviceExtensions.length > 0 ? realtimeTagListPrefix : [];
        } else {
            extensionLibraryThumbnailData = filterAndSort(
                this.state.deviceExtensions
                    .filter(extension => supportsProgramMode(extension, 'upload'))
                    .map(extension => ({
                        ...extension,
                        isDeviceExtension: true
                    }))
            );
            tags = tagListPrefix;
        }

        return (
            <LibraryComponent
                autoClose={this.props.isRealtimeMode}
                data={extensionLibraryThumbnailData}
                filterable
                tags={tags}
                id="extensionLibrary"
                isUnloadble
                title={this.props.intl.formatMessage(messages.extensionTitle)}
                visible={this.props.visible}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

ExtensionLibrary.propTypes = {
    deviceData: PropTypes.instanceOf(Array).isRequired,
    deviceId: PropTypes.string,
    intl: intlShape.isRequired,
    isRealtimeMode: PropTypes.bool,
    onCategorySelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired // eslint-disable-line react/no-unused-prop-types
};

const mapStateToProps = state => ({
    deviceData: state.scratchGui.deviceData.deviceData,
    deviceId: state.scratchGui.device.deviceId,
    isRealtimeMode: state.scratchGui.programMode.isRealtimeMode
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps
    )
)(ExtensionLibrary);
