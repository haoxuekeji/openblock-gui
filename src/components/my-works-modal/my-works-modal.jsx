import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, intlShape, defineMessages} from 'react-intl';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import styles from './my-works-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'My works',
        description: 'Title of the platform works browser modal',
        id: 'gui.myWorksModal.title'
    }
});

class WorkCard extends React.Component {
    constructor (props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleOpen () {
        if (this.props.busy) return;
        this.props.onOpen(this.props.work);
    }

    handleDelete (event) {
        event.stopPropagation();
        this.props.onDelete(this.props.work);
    }

    render () {
        const {work, busy, formatDate} = this.props;
        return (
            <div className={styles.card}>
                <div
                    className={styles.cover}
                    onClick={this.handleOpen}
                >
                    {work.coverUrl ? (
                        <img
                            alt=""
                            className={styles.coverImage}
                            draggable={false}
                            src={work.coverUrl}
                        />
                    ) : (
                        <div className={styles.coverPlaceholder}>{'▶'}</div>
                    )}
                    <span
                        className={classNames(
                            styles.badge,
                            work.isPublished ? styles.badgePublished : null
                        )}
                    >
                        {work.isPublished ? (
                            <FormattedMessage
                                defaultMessage="Published"
                                description="Badge for a published work"
                                id="gui.myWorksModal.published"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Draft"
                                description="Badge for an unpublished work"
                                id="gui.myWorksModal.draft"
                            />
                        )}
                    </span>
                </div>
                <div className={styles.cardBody}>
                    <div
                        className={styles.title}
                        title={work.title}
                        onClick={this.handleOpen}
                    >
                        {work.title || (
                            <FormattedMessage
                                defaultMessage="Untitled"
                                description="Fallback name for a work without title"
                                id="gui.myWorksModal.untitled"
                            />
                        )}
                    </div>
                    <div className={styles.date}>{formatDate(work.updatedAt || work.createdAt)}</div>
                    <div className={styles.actions}>
                        <button
                            className={styles.button}
                            disabled={busy}
                            onClick={this.handleOpen}
                        >
                            <FormattedMessage
                                defaultMessage="Open"
                                description="Open a work from the platform in the editor"
                                id="gui.myWorksModal.open"
                            />
                        </button>
                        <button
                            className={classNames(styles.button, styles.deleteButton)}
                            disabled={busy}
                            onClick={this.handleDelete}
                        >
                            <FormattedMessage
                                defaultMessage="Delete"
                                description="Delete a work from the platform"
                                id="gui.myWorksModal.delete"
                            />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

WorkCard.propTypes = {
    busy: PropTypes.bool,
    formatDate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    work: PropTypes.shape({
        id: PropTypes.number,
        title: PropTypes.string,
        coverUrl: PropTypes.string,
        isPublished: PropTypes.bool,
        createdAt: PropTypes.string,
        updatedAt: PropTypes.string
    })
};

const MyWorksModalComponent = props => {
    const totalPages = Math.max(1, Math.ceil(props.total / props.pageSize));
    return (
        <Modal
            className={styles.modalContent}
            contentLabel={props.intl.formatMessage(messages.title)}
            headerClassName={styles.header}
            id="myWorksModal"
            onRequestClose={props.onCancel}
        >
            <Box className={styles.body}>
                {props.loggedIn ? (
                    <React.Fragment>
                        <div className={styles.toolbar}>
                            <span className={styles.total}>
                                <FormattedMessage
                                    defaultMessage="{total} works"
                                    description="Total number of works of the current user"
                                    id="gui.myWorksModal.total"
                                    values={{total: props.total}}
                                />
                            </span>
                            <button
                                className={styles.button}
                                disabled={props.busy}
                                onClick={props.onRefresh}
                            >
                                <FormattedMessage
                                    defaultMessage="Refresh"
                                    description="Reload the works list"
                                    id="gui.myWorksModal.refresh"
                                />
                            </button>
                        </div>
                        {props.works.length === 0 && !props.busy ? (
                            <div className={styles.empty}>
                                <FormattedMessage
                                    defaultMessage="No works yet. Save a project to see it here."
                                    description="Empty works list message"
                                    id="gui.myWorksModal.empty"
                                />
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {props.works.map(work => (
                                    <WorkCard
                                        busy={props.busy}
                                        formatDate={props.formatDate}
                                        key={work.id}
                                        onDelete={props.onDelete}
                                        onOpen={props.onOpen}
                                        work={work}
                                    />
                                ))}
                            </div>
                        )}
                        <div className={styles.pager}>
                            <button
                                className={styles.button}
                                disabled={props.busy || props.page <= 1}
                                onClick={props.onPrevPage}
                            >
                                <FormattedMessage
                                    defaultMessage="Prev"
                                    description="Previous page of the works list"
                                    id="gui.myWorksModal.prevPage"
                                />
                            </button>
                            <span className={styles.pageInfo}>
                                {`${props.page} / ${totalPages}`}
                            </span>
                            <button
                                className={styles.button}
                                disabled={props.busy || props.page >= totalPages}
                                onClick={props.onNextPage}
                            >
                                <FormattedMessage
                                    defaultMessage="Next"
                                    description="Next page of the works list"
                                    id="gui.myWorksModal.nextPage"
                                />
                            </button>
                        </div>
                        <div
                            className={classNames(styles.status, props.error ? styles.error : null)}
                        >
                            {props.error || (props.busy ? '…' : '')}
                        </div>
                    </React.Fragment>
                ) : (
                    <div className={styles.empty}>
                        <FormattedMessage
                            defaultMessage="Sign in to see your works."
                            description="Works list requires login"
                            id="gui.myWorksModal.loginRequired"
                        />
                    </div>
                )}
            </Box>
        </Modal>
    );
};

MyWorksModalComponent.propTypes = {
    busy: PropTypes.bool,
    error: PropTypes.string,
    formatDate: PropTypes.func.isRequired,
    intl: intlShape,
    loggedIn: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onNextPage: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onPrevPage: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    page: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number,
    works: PropTypes.arrayOf(PropTypes.object)
};

export default MyWorksModalComponent;
