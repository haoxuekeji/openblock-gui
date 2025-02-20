import React from 'react';
import PropTypes from 'prop-types';
import Box from '../box/box.jsx';
import classNames from 'classnames';

import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants.js';
import {getStageDimensions} from '../../lib/screen-utils.js';
import CodeEditor from '../../containers/code-editor.jsx';
import HardwareConsole from '../../containers/hardware-console.jsx';

import styles from './hardware.css';

import lockIcon from './icon--lock.svg';
import unlockIcon from './icon--unlock.svg';

const HardwareComponent = props => {
    const {
        codeEditorLanguage,
        codeEditorOptions,
        codeEditorTheme,
        codeEditorValue,
        isCodeEditorLocked,
        onCodeEditorWillMount,
        onCodeEditorDidMount,
        onCodeEditorChange,
        onClickCodeEditorLock,
        stageSize
    } = props;
    const stageDimensions = getStageDimensions(stageSize, null);
    return (
        <Box className={styles.hardwareWrapper}>
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
            <Box
                className={classNames(styles.hardwareConsoleWrapper)}
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
    isCodeEditorLocked: PropTypes.bool,
    onCodeEditorWillMount: PropTypes.func,
    onCodeEditorDidMount: PropTypes.func,
    onCodeEditorChange: PropTypes.func,
    onClickCodeEditorLock: PropTypes.func,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired
};

export default HardwareComponent;
