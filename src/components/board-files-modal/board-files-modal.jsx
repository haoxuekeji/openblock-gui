import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, intlShape, defineMessages} from 'react-intl';
import bindAll from 'lodash.bindall';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import styles from './board-files-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Board files',
        description: 'Title of the MicroPython board file manager modal',
        id: 'gui.boardFilesModal.title'
    }
});

const formatSize = size => {
    if (!size && size !== 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

class BoardFileRow extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleOpen',
            'handleDownload',
            'handleDelete'
        ]);
    }

    handleOpen () {
        if (this.props.entry.isDir) {
            this.props.onOpenDirectory(this.props.entry.path);
        }
    }

    handleDownload (event) {
        event.stopPropagation();
        this.props.onDownload(this.props.entry);
    }

    handleDelete (event) {
        event.stopPropagation();
        this.props.onDelete(this.props.entry);
    }

    render () {
        const {entry, busy} = this.props;
        return (
            <div
                className={classNames(styles.row, entry.isDir ? styles.rowDir : null)}
                onClick={entry.isDir ? this.handleOpen : null}
            >
                <span className={styles.name}>
                    {entry.name}{entry.isDir ? '/' : ''}
                </span>
                <span className={styles.meta}>
                    {entry.isDir ? '—' : formatSize(entry.size)}
                </span>
                {entry.isDir ? null : (
                    <span className={styles.actions}>
                        <button
                            className={styles.button}
                            disabled={busy}
                            onClick={this.handleDownload}
                        >
                            <FormattedMessage
                                defaultMessage="Save"
                                description="Download board file to computer"
                                id="gui.boardFilesModal.download"
                            />
                        </button>
                        <button
                            className={styles.button}
                            disabled={busy}
                            onClick={this.handleDelete}
                        >
                            <FormattedMessage
                                defaultMessage="Delete"
                                description="Delete board file"
                                id="gui.boardFilesModal.delete"
                            />
                        </button>
                    </span>
                )}
            </div>
        );
    }
}

BoardFileRow.propTypes = {
    busy: PropTypes.bool,
    entry: PropTypes.shape({
        name: PropTypes.string,
        path: PropTypes.string,
        isDir: PropTypes.bool,
        size: PropTypes.number
    }),
    onDelete: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired,
    onOpenDirectory: PropTypes.func.isRequired
};

const BoardFilesModalComponent = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.intl.formatMessage(messages.title)}
        headerClassName={styles.header}
        id="boardFilesModal"
        onRequestClose={props.onCancel}
    >
        <Box className={styles.body}>
            <div className={styles.toolbar}>
                <span className={styles.path}>{props.currentPath}</span>
                <button
                    className={styles.button}
                    disabled={props.busy || props.currentPath === '/'}
                    onClick={props.onGoUp}
                >
                    <FormattedMessage
                        defaultMessage="Up"
                        description="Go to parent directory in board file manager"
                        id="gui.boardFilesModal.up"
                    />
                </button>
                <button
                    className={styles.button}
                    disabled={props.busy}
                    onClick={props.onRefresh}
                >
                    <FormattedMessage
                        defaultMessage="Refresh"
                        description="Refresh board file list"
                        id="gui.boardFilesModal.refresh"
                    />
                </button>
                <button
                    className={styles.button}
                    disabled={props.busy}
                    onClick={props.onUpload}
                >
                    <FormattedMessage
                        defaultMessage="Upload"
                        description="Upload a local file to the board"
                        id="gui.boardFilesModal.upload"
                    />
                </button>
            </div>
            <div className={styles.list}>
                {props.entries.length === 0 && !props.busy ? (
                    <div className={styles.empty}>
                        <FormattedMessage
                            defaultMessage="No files in this directory"
                            description="Empty board directory message"
                            id="gui.boardFilesModal.empty"
                        />
                    </div>
                ) : null}
                {props.entries.map(entry => (
                    <BoardFileRow
                        busy={props.busy}
                        entry={entry}
                        key={entry.path}
                        onDelete={props.onDelete}
                        onDownload={props.onDownload}
                        onOpenDirectory={props.onOpenDirectory}
                    />
                ))}
            </div>
            <div
                className={classNames(styles.status, props.error ? styles.error : null)}
            >
                {props.error || props.status || (props.busy ? '…' : '')}
            </div>
        </Box>
    </Modal>
);

BoardFilesModalComponent.propTypes = {
    busy: PropTypes.bool,
    currentPath: PropTypes.string,
    entries: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        path: PropTypes.string,
        isDir: PropTypes.bool,
        size: PropTypes.number
    })),
    error: PropTypes.string,
    intl: intlShape,
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired,
    onGoUp: PropTypes.func.isRequired,
    onOpenDirectory: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    onUpload: PropTypes.func.isRequired,
    status: PropTypes.string
};

export default BoardFilesModalComponent;
