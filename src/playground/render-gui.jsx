import React from 'react';
import ReactDOM from 'react-dom';
import { compose } from 'redux';

import { connect } from 'react-redux';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import log from '../lib/log.js';

import MessageBoxType from '../lib/message-box.js';

const onClickLogo = () => {
    //window.location = 'https://openblockcc.github.io/wiki/';
};

const onClickCheckUpdate = () => {
    log('User click check update');
};

const onClickUpgrade = () => {
    log('User click upgrade');
};

const onClickClearCache = () => {
    log('User click clear cahce');
};

const onClickInstallDriver = () => {
    log('User click install driver');
};
import API from '../lib/api'
import Box from '../components/box/box.jsx';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { setPlayer } from '../reducers/mode';
import { setSession } from '../reducers/session';
window.api = API
import styles from './player.css';


const handleTelemetryModalCancel = () => {
    log('User canceled telemetry modal');
};

const handleTelemetryModalOptIn = () => {
    log('User opted into telemetry');
};

const handleTelemetryModalOptOut = () => {
    log('User opted out of telemetry');
};

const handleShowMessageBox = (type, message) => {
    if (type === MessageBoxType.confirm) {
        return confirm(message); // eslint-disable-line no-alert
    } else if (type === MessageBoxType.alert) {
        return alert(message); // eslint-disable-line no-alert
    }
};

const handleUpdateProjectTitle = (title) => {
    if (window.scratchConfig && window.scratchConfig.handleUpdateProjectTitle) {
        window.scratchConfig.handleUpdateProjectTitle(title)
    }
}

const handleLogOut = () => {
    let data = {
        session: {
            user: {
                username: ''
            }
        }
    }
    window.setSession(data);
}
const handleLogIn = (form, callback) => {
    let data = {
        session: {
            user: {
                userid: 11,
                username: 'user.name',
            }
        }
    }
    window.setSession(data);
    callback({ success: true })
}
/*
 * Render the GUI playground. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default appTarget => {
    GUI.setAppElement(appTarget);

    // note that redux's 'compose' function is just being used as a general utility to make
    // the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
    // ability to compose reducers.


    // TODO a hack for testing the backpack, allow backpack host to be set by url param
    //const backpackHostMatches = window.location.href.match(/[?&]backpack_host=([^&]*)&?/);
    //const backpackHost = backpackHostMatches ? backpackHostMatches[1] : null;

    const scratchDesktopMatches = window.location.href.match(/[?&]isScratchDesktop=([^&]+)/);
    let simulateScratchDesktop;
    if (scratchDesktopMatches) {
        try {
            // parse 'true' into `true`, 'false' into `false`, etc.
            simulateScratchDesktop = JSON.parse(scratchDesktopMatches[1]);
        } catch {
            // it's not JSON so just use the string
            // note that a typo like "falsy" will be treated as true
            simulateScratchDesktop = scratchDesktopMatches[1];
        }
    }

    if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
        // Warn before navigating away
        window.onbeforeunload = () => true;
    }

    const backpackHost = location.origin + '/api/v1/backpack'
    // important: this is checking whether `simulateScratchDesktop` is truthy, not just defined!

    var logIn = handleLogIn
    var logOut = handleLogOut
    if (window.scratchConfig && window.scratchConfig.handleLogin) {
        logIn = window.scratchConfig.onLogIn
        logOut = window.scratchConfig.onLogOut
    }
    const Guier = (props) => (
        <Box className={classNames(props.isPlayerOnly ? styles.stageOnly : styles.editor)}>
            {props.isPlayerOnly && <button onClick={props.onSeeInside}>{'进去看看'}</button>}

            {simulateScratchDesktop ?
                <GUI
                    canEditTitle
                    isScratchDesktop
                    showTelemetryModal
                    canSave={false}
                    onTelemetryModalCancel={handleTelemetryModalCancel}
                    onTelemetryModalOptIn={handleTelemetryModalOptIn}
                    onTelemetryModalOptOut={handleTelemetryModalOptOut}
                /> :
                <GUI
                    canEditTitle
                    //showComingSoon

                    //canCreateCopy
                    isPlayerOnly={props.isPlayerOnly}
                    //enableCommunity={props.enableCommunity}
                    //canRemix
                    //canManageFiles
                    onShowMessageBox={handleShowMessageBox}
                    backpackHost={backpackHost}
                    //canSave={true}
                    onClickLogo={onClickLogo}
                    onUpdateProjectTitle={handleUpdateProjectTitle}
                    //canShare
                    cloudHost={location.origin}
                    onLogOut={logOut}
                    renderLogin={logIn}
                />}
            {window.setSession = props.onSetSession}
        </Box>

    );
    Guier.propTypes = {
        isPlayerOnly: PropTypes.bool,
        onSeeInside: PropTypes.func,
        projectId: PropTypes.string,
        enableCommunity: PropTypes.bool,

    };
    Guier.defaultProps = {
        isPlayerOnly: true,
        enableCommunity: window.scratchConfig.enableCommunity ? true : false
    };
    const mapStateToProps = state => {
        window.isPlayerOnly = state.scratchGui.mode.isPlayerOnly
        return {
            isPlayerOnly: state.scratchGui.mode.isPlayerOnly
        }

    };

    const mapDispatchToProps = dispatch => ({
        onSeeInside: () => dispatch(setPlayer(false)),
        onSetSession: s => dispatch(setSession(s)),
    });
    const ConnectedGUI = connect(
        mapStateToProps,
        mapDispatchToProps
    )(Guier);

    const WrappedGui = compose(
        AppStateHOC,
        HashParserHOC
    )(ConnectedGUI);

    ReactDOM.render(<WrappedGui isPlayerOnly={window.scratchConfig.isPlayerOnly} />, appTarget);
};
