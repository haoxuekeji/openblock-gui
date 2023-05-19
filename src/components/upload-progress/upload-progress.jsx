import React from 'react';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import keyMirror from 'keymirror';

import Ansi from 'ansi-to-react';
import ScrollableFeed from 'react-scrollable-feed';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import Dots from '../connection-modal/dots.jsx';

import styles from './upload-progress.css';

const PHASES = keyMirror({
    uploading: null,
    success: null,
    error: null,
    timeout: null,
    aborted: null
});

const UploadProgressComponent = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.name}
        headerClassName={styles.header}
        headerImage={props.connectionSmallIconURL}
        id="connectionModal"
        onHelp={props.onHelp}
        onRequestClose={props.onStopAutoClose}
        shouldCloseOnOverlayClick
        closeButtonVisible={false}
    >
        <Box
            className={styles.body}
            onClick={props.onStopAutoClose}
        >
            <Box className={styles.terminalWarper}>
                <ScrollableFeed
                    className={styles.terminalText}
                    ref={props.scrollableRef}
                >
                    <Ansi>
                        {props.text}
                    </Ansi>
                </ScrollableFeed>
            </Box>
            <Dots
                className={styles.bottomAreaItem}
                counter={0}
                total={3}
            />
            <Box className={styles.bottomArea}>
                <Box className={classNames(styles.bottomAreaItem, styles.instructions)}>
                    {props.phase === PHASES.uploading ? (
                        <FormattedMessage
                            defaultMessage="Uploading"
                            description="Prompt for upload in progress"
                            id="gui.uploadProgress.uploading"
                        />
                    ) : null}
                    {props.phase === PHASES.success ? (
                        <FormattedMessage
                            defaultMessage="Upload success"
                            description="Prompt for upload success"
                            id="gui.uploadProgress.uploadSuccess"
                        />
                    ) : null}
                    {props.phase === PHASES.error ? (
                        <FormattedMessage
                            defaultMessage="Upload error"
                            description="Prompt for upload error"
                            id="gui.uploadProgress.uploadError"
                        />
                    ) : null}
                    {props.phase === PHASES.timeout ? (
                        <FormattedMessage
                            defaultMessage="Upload timeout"
                            description="Prompt for upload timeout"
                            id="gui.uploadProgress.uploadTimeout"
                        />
                    ) : null}
                    {props.phase === PHASES.aborted ? (
                        <FormattedMessage
                            defaultMessage="Upload aborted"
                            description="Prompt for upload aborted"
                            id="gui.uploadProgress.uploadAborted"
                        />
                    ) : null}
                </Box>
                {
                    (props.phase === PHASES.uploading && props.abortEnabled) ?
                        <button
                            className={classNames(styles.bottomAreaItem, styles.connectionButton)}
                            onClick={props.onAbort}
                        >
                            <FormattedMessage
                                defaultMessage="Abort"
                                description="Button in bottom to abort upload process"
                                id="gui.uploadProgress.abort"
                            />
                        </button> :
                        <button
                            className={classNames(styles.bottomAreaItem, styles.connectionButton)}
                            onClick={props.onCancel}
                            disabled={props.phase === PHASES.uploading}
                        >
                            <FormattedMessage
                                defaultMessage="Close"
                                description="Button in bottom to close after upload"
                                id="gui.uploadProgress.close"
                            />
                            &nbsp;
                            {((props.phase === PHASES.success ||
                                props.phase === PHASES.aborted) &&
                                props.autoCloseCount !== 0) ?
                                `(${props.autoCloseCount / 1000}s)` : null}
                        </button>
                }
            </Box>
        </Box>
    </Modal>
);

UploadProgressComponent.propTypes = {
    connectionSmallIconURL: PropTypes.string,
    name: PropTypes.node,
    abortEnabled: PropTypes.bool.isRequired,
    autoCloseCount: PropTypes.number.isRequired,
    onAbort: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onHelp: PropTypes.func.isRequired,
    onStopAutoClose: PropTypes.func.isRequired,
    text: PropTypes.string.isRequired,
    phase: PropTypes.oneOf(Object.keys(PHASES)).isRequired,
    scrollableRef: PropTypes.object // eslint-disable-line react/forbid-prop-types
};

UploadProgressComponent.defaultProps = {
};

export {
    UploadProgressComponent as default,
    PHASES
};
