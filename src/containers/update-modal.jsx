import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';

import {connect} from 'react-redux';
import {compose} from 'redux';
import {injectIntl, intlShape, defineMessages} from 'react-intl';

import {closeUpdateModal} from '../reducers/modals';
import {setUpdate, clearUpdate} from '../reducers/update';

import UpdateModalComponent from '../components/update-modal/update-modal.jsx';
import MessageBoxType from '../lib/message-box.js';
import {UPDATE_MODAL_STATE} from '../lib/update-state.js';

const messages = defineMessages({
    updateWarning: {
        id: 'gui.updateModal.updateWarning',
        defaultMessage: 'Currently unsaved projects will be lost, continue update and restart?',
        description: 'Confirmation that user wants update'
    }
});

class UpdateModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCancel',
            'handleClickUpdate'
        ]);
    }
    componentWillUnmount () {
        clearInterval(this.downloadInterval);
    }

    handleCancel () {
        this.props.onClearUpdate();
        this.props.onAbortUpdate();
    }

    handleClickUpdate () {
        const confirmUpdate = this.props.onShowMessageBox(MessageBoxType.confirm,
            this.props.intl.formatMessage(messages.updateWarning));
        if (confirmUpdate) {
            this.props.onSetUpdate({phase: 'downloading', speed: 0, transferred: 0});
            this.props.onClickUpdate();
        }
    }

    render () {
        return (
            <UpdateModalComponent
                intl={this.props.intl}
                onClickUpdate={this.handleClickUpdate}
                onCancel={this.handleCancel}
                updateState={this.props.updateState}
            />
        );
    }
}

UpdateModal.propTypes = {
    intl: intlShape,
    onAbortUpdate: PropTypes.func.isRequired,
    onClickUpdate: PropTypes.func.isRequired,
    onClearUpdate: PropTypes.func.isRequired,
    onSetUpdate: PropTypes.func.isRequired,
    onShowMessageBox: PropTypes.func.isRequired,
    updateState: PropTypes.shape({
        phase: PropTypes.oneOf(Object.keys(UPDATE_MODAL_STATE)),
        info:
            PropTypes.shape({
                version: PropTypes.string,
                message: PropTypes.oneOf([PropTypes.object, PropTypes.string]),
                phase: PropTypes.string,
                progress: PropTypes.number,
                state: PropTypes.shape({
                    name: PropTypes.string,
                    speed: PropTypes.string,
                    total: PropTypes.string,
                    done: PropTypes.string
                })
            })
    })
};

const mapStateToProps = state => ({
    updateMessage: state.scratchGui.update.updateMessage,
    updateState: state.scratchGui.update.updateState
});

const mapDispatchToProps = dispatch => ({
    onClearUpdate: () => {
        dispatch(closeUpdateModal());
        dispatch(clearUpdate());
    },
    onSetUpdate: message => dispatch(setUpdate(message))
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(UpdateModal);
