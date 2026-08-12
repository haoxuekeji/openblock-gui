import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {injectIntl, intlShape, defineMessages} from 'react-intl';

import MyWorksModalComponent from '../components/my-works-modal/my-works-modal.jsx';
import {closeMyWorksModal} from '../reducers/modals';
import {setProjectId} from '../reducers/project-state';
import MessageBoxType from '../lib/message-box';
import log from '../lib/log';

const PAGE_SIZE = 12;

const messages = defineMessages({
    deleteConfirm: {
        defaultMessage: 'Delete "{title}" from the platform? This cannot be undone.',
        description: 'Confirm deleting a work from the platform',
        id: 'gui.myWorksModal.deleteConfirm'
    },
    discardChangesConfirm: {
        defaultMessage: 'The current project has unsaved changes. Open another work anyway?',
        description: 'Confirm discarding unsaved changes before opening a work',
        id: 'gui.myWorksModal.discardChangesConfirm'
    },
    loadError: {
        defaultMessage: 'Could not load the works list.',
        description: 'Works list request failed',
        id: 'gui.myWorksModal.loadError'
    },
    deleteError: {
        defaultMessage: 'Could not delete the work.',
        description: 'Work delete request failed',
        id: 'gui.myWorksModal.deleteError'
    }
});

/**
 * Base URL of the works collection API, e.g. https://host/api/v1/scratch/projects.
 * Derived from the single-project host used by scratch-storage unless the
 * embedder provides an explicit worksHost.
 * @returns {string} works API base without trailing slash
 */
const worksApiBase = () => {
    const config = window.scratchConfig || {};
    if (config.worksHost) {
        return String(config.worksHost).replace(/\/$/, '');
    }
    const projectHost = String(config.projectHost || '').replace(/\/$/, '');
    return projectHost.replace(/\/project$/, '/projects');
};

const projectApiBase = () => {
    const config = window.scratchConfig || {};
    return String(config.projectHost || '').replace(/\/$/, '');
};

/** @returns {string} origin used to resolve relative cover URLs */
const platformOrigin = () => {
    try {
        return new URL(worksApiBase()).origin;
    } catch (e) {
        return '';
    }
};

class MyWorksModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleRefresh',
            'handleOpen',
            'handleDelete',
            'handlePrevPage',
            'handleNextPage',
            'formatDate'
        ]);
        this.state = {
            works: [],
            total: 0,
            page: 1,
            busy: false,
            error: ''
        };
    }

    componentDidMount () {
        if (this.props.token) {
            this.fetchWorks(1);
        }
    }

    _authToken () {
        if (this.props.token) return this.props.token;
        try {
            return window.localStorage.getItem('token') || '';
        } catch (e) {
            return '';
        }
    }

    fetchWorks (page) {
        const token = this._authToken();
        if (!token) return;
        this.setState({busy: true, error: ''});
        fetch(`${worksApiBase()}/mine?page=${page}&page_size=${PAGE_SIZE}`, {
            headers: {Authorization: `Bearer ${token}`}
        })
            .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
            .then(data => {
                const origin = platformOrigin();
                const works = (data.items || []).map(item => ({
                    id: item.id,
                    title: item.title || '',
                    coverUrl: item.cover_url ?
                        (/^https?:\/\//.test(item.cover_url) ? item.cover_url : origin + item.cover_url) :
                        '',
                    isPublished: Boolean(item.is_published),
                    createdAt: item.created_at || '',
                    updatedAt: item.updated_at || ''
                }));
                this.setState({
                    works,
                    total: data.total || 0,
                    page,
                    busy: false
                });
            })
            .catch(err => {
                log.error('Could not fetch works list', err);
                this.setState({
                    busy: false,
                    error: this.props.intl.formatMessage(messages.loadError)
                });
            });
    }

    handleRefresh () {
        this.fetchWorks(this.state.page);
    }

    handlePrevPage () {
        if (this.state.page > 1) {
            this.fetchWorks(this.state.page - 1);
        }
    }

    handleNextPage () {
        const totalPages = Math.max(1, Math.ceil(this.state.total / PAGE_SIZE));
        if (this.state.page < totalPages) {
            this.fetchWorks(this.state.page + 1);
        }
    }

    handleOpen (work) {
        if (this.props.projectChanged) {
            const confirmed = typeof this.props.onShowMessageBox === 'function' ?
                this.props.onShowMessageBox(
                    MessageBoxType.confirm,
                    this.props.intl.formatMessage(messages.discardChangesConfirm)
                ) :
                // eslint-disable-next-line no-alert
                confirm(this.props.intl.formatMessage(messages.discardChangesConfirm));
            if (!confirmed) return;
        }
        this.props.onOpenProject(String(work.id));
        this.props.onCancel();
    }

    handleDelete (work) {
        const message = this.props.intl.formatMessage(
            messages.deleteConfirm, {title: work.title || work.id}
        );
        const confirmed = typeof this.props.onShowMessageBox === 'function' ?
            this.props.onShowMessageBox(MessageBoxType.confirm, message) :
            // eslint-disable-next-line no-alert
            confirm(message);
        if (!confirmed) return;

        const token = this._authToken();
        this.setState({busy: true, error: ''});
        fetch(`${projectApiBase()}/${work.id}`, {
            method: 'DELETE',
            headers: {Authorization: `Bearer ${token}`}
        })
            .then(res => (res.ok ? res : Promise.reject(new Error(`HTTP ${res.status}`))))
            .then(() => {
                // Step back a page when the last item of the current page
                // was removed, so the list never shows an empty page.
                const remaining = this.state.total - 1;
                const totalPages = Math.max(1, Math.ceil(remaining / PAGE_SIZE));
                this.fetchWorks(Math.min(this.state.page, totalPages));
            })
            .catch(err => {
                log.error('Could not delete work', err);
                this.setState({
                    busy: false,
                    error: this.props.intl.formatMessage(messages.deleteError)
                });
            });
    }

    formatDate (isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        return this.props.intl.formatDate(date, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    render () {
        return (
            <MyWorksModalComponent
                busy={this.state.busy}
                error={this.state.error}
                formatDate={this.formatDate}
                intl={this.props.intl}
                loggedIn={Boolean(this._authToken())}
                onCancel={this.props.onCancel}
                onDelete={this.handleDelete}
                onNextPage={this.handleNextPage}
                onOpen={this.handleOpen}
                onPrevPage={this.handlePrevPage}
                onRefresh={this.handleRefresh}
                page={this.state.page}
                pageSize={PAGE_SIZE}
                total={this.state.total}
                works={this.state.works}
            />
        );
    }
}

MyWorksModal.propTypes = {
    intl: intlShape.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOpenProject: PropTypes.func.isRequired,
    onShowMessageBox: PropTypes.func,
    projectChanged: PropTypes.bool,
    token: PropTypes.string
};

const mapStateToProps = state => {
    const user = state.session && state.session.session && state.session.session.user;
    return {
        projectChanged: state.scratchGui.projectChanged,
        token: (user && user.token) || ''
    };
};

const mapDispatchToProps = dispatch => ({
    onCancel: () => dispatch(closeMyWorksModal()),
    onOpenProject: projectId => dispatch(setProjectId(projectId))
});

export default compose(
    injectIntl,
    connect(mapStateToProps, mapDispatchToProps)
)(MyWorksModal);
