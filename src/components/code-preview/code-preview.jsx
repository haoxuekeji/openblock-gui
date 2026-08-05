import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage} from 'react-intl';

import Box from '../box/box.jsx';
import CloseButton from '../close-button/close-button.jsx';
import CodeEditor from '../../containers/code-editor.jsx';

import styles from './code-preview.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Python 代码预览',
        description: 'Title of the realtime Python code preview panel',
        id: 'gui.codePreview.title'
    }
});

// Monaco needs an explicit pixel width; keep in sync with .code-preview width
// in code-preview.css (panel width minus 2 * 1px border).
const EDITOR_WIDTH = 338;

const CodePreviewComponent = props => {
    const {
        code,
        onClose,
        unsupportedTotal
    } = props;
    return (
        <Box className={styles.codePreview}>
            <Box className={styles.header}>
                <span className={styles.title}>
                    <FormattedMessage {...messages.title} />
                </span>
                <CloseButton
                    className={styles.closeButton}
                    size={CloseButton.SIZE_SMALL}
                    onClick={onClose}
                />
            </Box>
            {unsupportedTotal > 0 ? (
                <Box className={styles.hint}>
                    <FormattedMessage
                        defaultMessage="{count} 块积木暂不支持转换"
                        description="Hint showing how many blocks in the workspace cannot be converted to Python yet"
                        id="gui.codePreview.unsupportedHint"
                        values={{count: unsupportedTotal}}
                    />
                </Box>
            ) : null}
            <Box className={styles.editorWrapper}>
                <CodeEditor
                    width={EDITOR_WIDTH}
                    value={code}
                    language="python"
                    theme="vs"
                    options={{
                        readOnly: true,
                        contextmenu: false,
                        quickSuggestions: false,
                        minimap: {enabled: false},
                        lineNumbersMinChars: 3,
                        folding: false,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false
                    }}
                />
            </Box>
        </Box>
    );
};

CodePreviewComponent.propTypes = {
    code: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    unsupportedTotal: PropTypes.number
};

CodePreviewComponent.defaultProps = {
    code: '',
    unsupportedTotal: 0
};

export default CodePreviewComponent;
