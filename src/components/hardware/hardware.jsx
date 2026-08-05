import React from 'react';
import PropTypes from 'prop-types';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import {defineMessages, intlShape} from 'react-intl';

import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants.js';
import {getStageDimensions} from '../../lib/screen-utils.js';
import CodeEditor from '../../containers/code-editor.jsx';
import HardwareConsole from '../../containers/hardware-console.jsx';

import styles from './hardware.css';

import lockIcon from './icon--lock.svg';
import unlockIcon from './icon--unlock.svg';
import exportIcon from '../hardware-console/export.svg';

const messages = defineMessages({
    exportCode: {
        defaultMessage: 'Save code to file',
        description: 'Button to download the generated code as a source file',
        id: 'gui.hardware.exportCode'
    }
});

const HardwareComponent = props => {
    const {
        canExportCode,
        codeEditorLanguage,
        codeEditorOptions,
        codeEditorTheme,
        codeEditorValue,
        consoleOnly,
        intl,
        isCodeEditorLocked,
        onCodeEditorWillMount,
        onCodeEditorDidMount,
        onCodeEditorChange,
        onClickCodeEditorLock,
        onClickExportCode,
        stageSize
    } = props;
    const stageDimensions = getStageDimensions(stageSize, null);
    return (
        <Box
            className={classNames(
                styles.hardwareWrapper,
                consoleOnly ? styles.consoleOnlyWrapper : null
            )}
        >
            {consoleOnly ? null : (
                <Box className={classNames(styles.codeEditorWrapper)}>
                    <button
                        className={classNames(styles.button, styles.lockButton)}
                        onClick={onClickCodeEditorLock}
                    >
                        <img
                            alt="Lock"
                            className={classNames(styles.lockIcon)}
                            src={isCodeEditorLocked ? lockIcon : unlockIcon}
                        />
                    </button>
                    {canExportCode ? (
                        <button
                            className={classNames(styles.button, styles.exportButton)}
                            title={intl.formatMessage(messages.exportCode)}
                            onClick={onClickExportCode}
                        >
                            <img
                                alt={intl.formatMessage(messages.exportCode)}
                                className={classNames(styles.lockIcon)}
                                src={exportIcon}
                            />
                        </button>
                    ) : null}
                    <CodeEditor
                        width={stageDimensions.width}
                        value={codeEditorValue}
                        language={codeEditorLanguage}
                        editorWillMount={onCodeEditorWillMount}
                        editorDidMount={onCodeEditorDidMount}
                        onChange={onCodeEditorChange}
                        theme={codeEditorTheme}
                        options={codeEditorOptions}
                    />
                </Box>
            )}
            <Box
                className={classNames(
                    styles.hardwareConsoleWrapper,
                    consoleOnly ? styles.consoleOnlyConsole : null
                )}
                style={{width: stageDimensions.width + 2}}
            >
                <HardwareConsole
                    {...props}
                />
            </Box>
        </Box>
    );
};

HardwareComponent.propTypes = {
    canExportCode: PropTypes.bool,
    consoleOnly: PropTypes.bool,
    codeEditorLanguage: PropTypes.string,
    codeEditorOptions: PropTypes.shape({
        highlightActiveIndentGuide: PropTypes.bool,
        cursorSmoothCaretAnimation: PropTypes.bool,
        readOnly: PropTypes.bool,
        contextmenu: PropTypes.bool,
        minimap: PropTypes.shape({
            enabled: PropTypes.bool
        })
    }),
    codeEditorTheme: PropTypes.string,
    codeEditorValue: PropTypes.string,
    intl: intlShape,
    isCodeEditorLocked: PropTypes.bool,
    onCodeEditorWillMount: PropTypes.func,
    onCodeEditorDidMount: PropTypes.func,
    onCodeEditorChange: PropTypes.func,
    onClickCodeEditorLock: PropTypes.func,
    onClickExportCode: PropTypes.func,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired
};

export default HardwareComponent;
