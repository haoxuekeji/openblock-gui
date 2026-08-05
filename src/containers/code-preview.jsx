import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import CodePreviewComponent from '../components/code-preview/code-preview.jsx';
import {setCodePreviewVisible} from '../reducers/code-preview';

// Floating read-only panel showing the Python equivalent of the current
// workspace (FUN-001B). Rendering is gated on the persisted toggle so the
// Monaco editor is only mounted while the preview is actually open.
const CodePreview = props => {
    if (!props.visible) return null;
    return (
        <CodePreviewComponent
            code={props.code}
            unsupportedTotal={props.unsupportedTotal}
            onClose={props.onClose}
        />
    );
};

CodePreview.propTypes = {
    code: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    unsupportedTotal: PropTypes.number,
    visible: PropTypes.bool
};

const mapStateToProps = state => ({
    visible: state.scratchGui.codePreview.visible,
    code: state.scratchGui.codePreview.code,
    unsupportedTotal: state.scratchGui.codePreview.unsupportedTotal
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(setCodePreviewVisible(false))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CodePreview);
