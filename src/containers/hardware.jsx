import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';

import {connect} from 'react-redux';
import {compose} from 'redux';
import {injectIntl, intlShape, defineMessages} from 'react-intl';

import {showAlertWithTimeout} from '../reducers/alerts';
import {setCodeEditorValue, toggleLock} from '../reducers/code';

import {STAGE_DISPLAY_SIZES} from '../lib/layout-constants.js';
import {getLanguageFromDeviceType} from '../lib/device';
import downloadBlob from '../lib/download-blob';
import MessageBoxType from '../lib/message-box';

import HardwareComponent from '../components/hardware/hardware.jsx';
import {registerCodeEditorCompletions} from '../lib/code-editor-completions';

const messages = defineMessages({
    relockOverwriteWarning: {
        defaultMessage: 'You edited the code by hand. After locking, the next change to the blocks ' +
            'will overwrite your manual edits. Lock anyway?',
        description: 'Warn that re-locking the code editor will discard manual edits on the next block change',
        id: 'gui.hardware.relockOverwriteWarning'
    }
});

class Hardware extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCodeEditorWillMount',
            'handleCodeEditorDidMount',
            'handleCodeEditorChange',
            'handleClickCodeEditorLock',
            'handleClickExportCode'
        ]);
    }

    handleCodeEditorWillMount (monaco) {
        monaco.editor.defineTheme('readOnlyTheme', {
            base: 'vs',
            inherit: true,
            rules: [{background: 'F9F9F9'}],
            colors: {
                'editor.background': '#F9F9F9'
            }
        });
        registerCodeEditorCompletions(monaco);
    }

    handleCodeEditorDidMount (editor) {
        // Close the alert message from editor
        const messageContribution = editor.getContribution(
            'editor.contrib.messageController'
        );
        if (messageContribution) {
            messageContribution.dispose();
        }

        editor.onDidAttemptReadOnlyEdit(() => {
            this.props.onCodeEditorIsLocked();
        });
    }

    handleCodeEditorChange (newValue) {
        this.props.onSetCodeEditorValue(newValue);
    }

    handleClickCodeEditorLock () {
        // Re-locking hands the editor content back to the block code
        // generator, silently discarding manual edits on the next block
        // change. Ask first when the code differs from the unlock snapshot.
        if (!this.props.isCodeEditorLocked &&
            this.props.lockSnapshot !== null &&
            this.props.codeEditorValue !== this.props.lockSnapshot &&
            typeof this.props.onShowMessageBox === 'function') {
            const confirmed = this.props.onShowMessageBox(MessageBoxType.confirm,
                this.props.intl.formatMessage(messages.relockOverwriteWarning));
            if (!confirmed) return;
        }
        this.props.onToggleCodeEditorLock();
    }

    handleClickExportCode () {
        const language = getLanguageFromDeviceType(this.props.deviceType);
        const extension = language === 'cpp' ? 'ino' : 'py';
        const title = (this.props.projectTitle || 'code').trim() || 'code';
        const blob = new Blob([this.props.codeEditorValue || ''], {type: 'text/plain'});
        downloadBlob(`${title}.${extension}`, blob);
    }

    render () {
        const codeEditorLanguage = getLanguageFromDeviceType(this.props.deviceType);
        const {
            ...props
        } = this.props;
        return (
            <HardwareComponent
                canExportCode={Boolean(this.props.deviceType)}
                codeEditorLanguage={codeEditorLanguage}
                codeEditorOptions={this.props.isCodeEditorLocked ? {
                    readOnly: true,
                    quickSuggestions: false
                } : {
                    readOnly: false,
                    quickSuggestions: true,
                    suggestOnTriggerCharacters: true,
                    wordBasedSuggestions: true
                }}
                codeEditorTheme={this.props.isCodeEditorLocked ? 'readOnlyTheme' : 'vs'}
                codeEditorValue={this.props.codeEditorValue}
                isCodeEditorLocked={this.props.isCodeEditorLocked}
                onCodeEditorWillMount={this.handleCodeEditorWillMount}
                onCodeEditorDidMount={this.handleCodeEditorDidMount}
                onCodeEditorChange={this.handleCodeEditorChange}
                onClickCodeEditorLock={this.handleClickCodeEditorLock}
                onClickExportCode={this.handleClickExportCode}
                {...props}
            />
        );
    }
}

Hardware.propTypes = {
    codeEditorValue: PropTypes.string,
    deviceType: PropTypes.string,
    intl: intlShape.isRequired,
    isCodeEditorLocked: PropTypes.bool.isRequired,
    lockSnapshot: PropTypes.string,
    onCodeEditorIsLocked: PropTypes.func.isRequired,
    onSetCodeEditorValue: PropTypes.func.isRequired,
    onShowMessageBox: PropTypes.func,
    onToggleCodeEditorLock: PropTypes.func.isRequired,
    projectTitle: PropTypes.string,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired
};

const mapStateToProps = state => ({
    codeEditorValue: state.scratchGui.code.codeEditorValue,
    deviceType: state.scratchGui.device.deviceType,
    isCodeEditorLocked: state.scratchGui.code.isCodeEditorLocked,
    lockSnapshot: state.scratchGui.code.lockSnapshot,
    projectTitle: state.scratchGui.projectTitle
});

const mapDispatchToProps = dispatch => ({
    onCodeEditorIsLocked: () => showAlertWithTimeout(dispatch, 'codeEditorIsLocked'),
    onSetCodeEditorValue: value => {
        dispatch(setCodeEditorValue(value));
    },
    onToggleCodeEditorLock: () => dispatch(toggleLock())
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(Hardware);
