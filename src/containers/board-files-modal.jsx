import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {injectIntl, intlShape, defineMessages} from 'react-intl';
import VM from 'openblock-vm';

import BoardFilesModalComponent from '../components/board-files-modal/board-files-modal.jsx';
import {closeBoardFilesModal} from '../reducers/modals';
import downloadBlob from '../lib/download-blob';
import MessageBoxType from '../lib/message-box';
import {DeviceType} from '../lib/device';

const messages = defineMessages({
    deleteConfirm: {
        defaultMessage: 'Delete {name} from the board?',
        description: 'Confirm deleting a board file',
        id: 'gui.boardFilesModal.deleteConfirm'
    },
    notConnected: {
        defaultMessage: 'Connect a MicroPython board first.',
        description: 'Board file manager requires a connected peripheral',
        id: 'gui.boardFilesModal.notConnected'
    },
    unsupported: {
        defaultMessage: 'Board file manager is only available for MicroPython devices.',
        description: 'Board file manager device type guard',
        id: 'gui.boardFilesModal.unsupported'
    }
});

class BoardFilesModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleRefresh',
            'handleOpenDirectory',
            'handleGoUp',
            'handleDownload',
            'handleDelete',
            'handleUpload',
            'handleFilePicked'
        ]);
        this.state = {
            currentPath: '.',
            entries: [],
            busy: false,
            error: '',
            status: ''
        };
        this._fileInput = null;
    }

    componentDidMount () {
        this.handleRefresh();
    }

    componentWillUnmount () {
        if (this._fileInput) {
            this._fileInput.removeEventListener('change', this.handleFilePicked);
            if (this._fileInput.parentNode) {
                this._fileInput.parentNode.removeChild(this._fileInput);
            }
            this._fileInput = null;
        }
    }

    _deviceId () {
        return this.props.deviceId;
    }

    _guardReady () {
        if (!this.props.deviceId) {
            this.setState({error: this.props.intl.formatMessage(messages.notConnected)});
            return false;
        }
        if (this.props.deviceType !== DeviceType.microPython) {
            this.setState({error: this.props.intl.formatMessage(messages.unsupported)});
            return false;
        }
        if (!this.props.vm.getPeripheralIsConnected(this.props.deviceId)) {
            this.setState({error: this.props.intl.formatMessage(messages.notConnected)});
            return false;
        }
        return true;
    }

    handleRefresh () {
        if (!this._guardReady()) return;
        const directory = this.state.currentPath;
        this.setState({busy: true, error: '', status: 'Loading…'});
        this.props.vm.listBoardFiles(this._deviceId(), directory)
            .then(entries => {
                this.setState({
                    entries: Array.isArray(entries) ? entries : [],
                    busy: false,
                    status: `${(entries || []).length} item(s)`
                });
            })
            .catch(err => {
                this.setState({
                    busy: false,
                    error: (err && err.message) || String(err),
                    status: ''
                });
            });
    }

    handleOpenDirectory (path) {
        this.setState({currentPath: path}, () => this.handleRefresh());
    }

    handleGoUp () {
        const current = this.state.currentPath;
        if (!current || current === '.' || current === '/') {
            return;
        }
        const parts = current.replace(/\/$/, '').split('/');
        parts.pop();
        const parent = parts.length === 0 ? '.' : parts.join('/');
        this.setState({currentPath: parent}, () => this.handleRefresh());
    }

    handleDownload (entry) {
        if (!this._guardReady()) return;
        this.setState({busy: true, error: '', status: `Reading ${entry.name}…`});
        this.props.vm.readBoardFile(this._deviceId(), entry.path)
            .then(file => {
                const binary = atob(file.contentBase64 || '');
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                downloadBlob(file.name || entry.name, new Blob([bytes]));
                this.setState({busy: false, status: `Saved ${entry.name}`});
            })
            .catch(err => {
                this.setState({
                    busy: false,
                    error: (err && err.message) || String(err),
                    status: ''
                });
            });
    }

    handleDelete (entry) {
        if (!this._guardReady()) return;
        const confirmed = typeof this.props.onShowMessageBox === 'function' ?
            this.props.onShowMessageBox(
                MessageBoxType.confirm,
                this.props.intl.formatMessage(messages.deleteConfirm, {name: entry.name})
            ) : true;
        if (!confirmed) return;
        this.setState({busy: true, error: '', status: `Deleting ${entry.name}…`});
        this.props.vm.removeBoardFile(this._deviceId(), entry.path)
            .then(() => {
                this.setState({status: `Deleted ${entry.name}`});
                this.handleRefresh();
            })
            .catch(err => {
                this.setState({
                    busy: false,
                    error: (err && err.message) || String(err),
                    status: ''
                });
            });
    }

    handleUpload () {
        if (!this._guardReady()) return;
        if (!this._fileInput) {
            this._fileInput = document.createElement('input');
            this._fileInput.type = 'file';
            this._fileInput.style.display = 'none';
            this._fileInput.addEventListener('change', this.handleFilePicked);
            document.body.appendChild(this._fileInput);
        }
        this._fileInput.value = '';
        this._fileInput.click();
    }

    handleFilePicked (event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const buffer = reader.result;
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const contentBase64 = btoa(binary);
            const dir = this.state.currentPath;
            const remotePath = (!dir || dir === '.') ? file.name : `${dir.replace(/\/$/, '')}/${file.name}`;
            this.setState({busy: true, error: '', status: `Writing ${file.name}…`});
            this.props.vm.writeBoardFile(this._deviceId(), remotePath, contentBase64)
                .then(() => {
                    this.setState({status: `Uploaded ${file.name}`});
                    this.handleRefresh();
                })
                .catch(err => {
                    this.setState({
                        busy: false,
                        error: (err && err.message) || String(err),
                        status: ''
                    });
                });
        };
        reader.onerror = () => {
            this.setState({error: 'Failed to read local file', busy: false});
        };
        reader.readAsArrayBuffer(file);
    }

    render () {
        return (
            <BoardFilesModalComponent
                busy={this.state.busy}
                currentPath={this.state.currentPath === '.' ? '/' : `/${this.state.currentPath}`}
                entries={this.state.entries}
                error={this.state.error}
                intl={this.props.intl}
                status={this.state.status}
                onCancel={this.props.onCancel}
                onDelete={this.handleDelete}
                onDownload={this.handleDownload}
                onGoUp={this.handleGoUp}
                onOpenDirectory={this.handleOpenDirectory}
                onRefresh={this.handleRefresh}
                onUpload={this.handleUpload}
            />
        );
    }
}

BoardFilesModal.propTypes = {
    deviceId: PropTypes.string,
    deviceType: PropTypes.string,
    intl: intlShape.isRequired,
    onCancel: PropTypes.func.isRequired,
    onShowMessageBox: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    deviceId: state.scratchGui.device.deviceId,
    deviceType: state.scratchGui.device.deviceType
});

const mapDispatchToProps = dispatch => ({
    onCancel: () => dispatch(closeBoardFilesModal())
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(BoardFilesModal);
