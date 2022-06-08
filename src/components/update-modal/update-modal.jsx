import React from 'react';
import {intlShape, FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ProgressBar from '@ramonak/react-progress-bar';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import {UPDATE_MODAL_STATE, RESOURCE_UPDATE_STATE, RESOURCE_UPDATE_CONTENT} from '../../lib/update-state.js';

import styles from './update-modal.css';

// Adds an initial offset value to the progress bar so that it can display the full percentage at the beginning
const PROGRESS_INITIAL_OFFSET_VALUE = 13.0;

const calculateProgressBarValue = progress => parseFloat(((progress * (100 - PROGRESS_INITIAL_OFFSET_VALUE)) + PROGRESS_INITIAL_OFFSET_VALUE).toFixed(1)); // eslint-disable-line max-len

const UpdateModalComponent = props => {
    let updateMessage;
    if (props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdateAvailable ||
        props.updateState.phase === UPDATE_MODAL_STATE.applicationUpdateAvailable) {
        if (typeof props.updateState.info.message === 'object') {
            if (props.updateState.info.message[`${props.intl.locale}`]) {
                updateMessage = props.updateState.info.message[`${props.intl.locale}`];
            } else if (props.intl.locale === 'zh-tw'){
                updateMessage = props.updateState.info.message['zh-cn'];
            } else {
                updateMessage = props.updateState.info.message.en;
            }
        }
    }

    const close = (
        <FormattedMessage
            defaultMessage="Close"
            description="Button in bottom to close update modal"
            id="gui.updateModal.close"
        />
    );

    const downloading = (
        <FormattedMessage
            defaultMessage="Downloading"
            description="Prompt for in downloading porgress"
            id="gui.updateModal.downloading"
        />
    );

    const abort = (
        <FormattedMessage
            defaultMessage="Abort"
            description="Button in bottom to abort update"
            id="gui.updateModal.abort"
        />
    );

    const progressBar = value => (
        <ProgressBar
            completed={value}
            bgColor="#4C97FF"
            baseBgColor="#D9E3F2"
            height="15px"
        />
    );

    return (
        <Modal
            className={styles.modalContent}
            headerClassName={styles.header}
            id="updateModal"
            onRequestClose={props.onCancel}
            shouldCloseOnOverlayClick={false}
            closeButtonVisible={false}
        >
            <Box className={styles.body}>
                {(props.updateState.phase === UPDATE_MODAL_STATE.checkingResource ||
                    props.updateState.phase === UPDATE_MODAL_STATE.checkingApplication) ? (
                        <div>
                            <div className={styles.updateTitle}>
                                <FormattedMessage
                                    defaultMessage="Checking for update"
                                    description="Tile of update modal in checking for update"
                                    id="gui.updateModel.tileCheckingForUpdate"
                                />
                            </div>
                            <div className={styles.updateInfo}>
                                <FormattedMessage
                                    defaultMessage="Depending on your network, this step may take a few seconds to a dozen seconds, please wait." // eslint-disable-line max-len
                                    description="Prompt for in checking update process"
                                    id="gui.updateModel.checkingTips"
                                />
                            </div>
                            <div className={styles.bottomArea}>
                                <button
                                    className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                    onClick={props.onCancel}
                                >
                                    {close}
                                </button>
                            </div>
                        </div>
                    ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdateAvailable ||
                    props.updateState.phase === UPDATE_MODAL_STATE.applicationUpdateAvailable) ? (
                        <div>
                            <div className={styles.updateTitle}>
                                {props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdateAvailable ?
                                    <FormattedMessage
                                        defaultMessage="New version of external resource detected"
                                        description="Tile of update modal in new external resource version detected"
                                        id="gui.updateModel.tileUpdateExternalResource"
                                    /> :
                                    <FormattedMessage
                                        defaultMessage="New version of this application adetected"
                                        description="Tile of update modal in new application version detected"
                                        id="gui.updateModel.tileUpdateApplication"
                                    />}
                                {`: ${props.updateState.info.version}`}
                            </div>
                            <div className={styles.updateInfo}>
                                {updateMessage ? Object.keys(updateMessage).map((subTitle, index) => (
                                    <div key={index}>
                                        <div className={styles.updateInfoSubTitle} >
                                            {subTitle}
                                        </div>
                                        <div className={styles.updateInfoDetail} >
                                            {updateMessage[`${subTitle}`].join('\n')}
                                        </div>
                                        { index === Object.keys(updateMessage).length - 1 ? null : <br /> }
                                    </div>
                                )) : null}
                            </div>
                            <div className={styles.bottomArea}>
                                <div className={styles.updateButtonWrapper}>
                                    <button
                                        className={classNames(styles.bottomAreaItem,
                                            styles.updateButton, styles.primary)}
                                        onClick={props.onCancel}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Update later"
                                            description="Button in bottom to update later"
                                            id="gui.updateModal.updateLater"
                                        />
                                    </button>
                                    <button
                                        className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                        onClick={props.onClickUpdate}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Update and restart"
                                            description="Button in bottom to confirm update and restart"
                                            id="gui.updateModal.updateAndRestart"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.latest) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="No new version detected"
                                description="Tile of update modal in already latest"
                                id="gui.updateModel.tileAlreadyLatest"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <FormattedMessage
                                defaultMessage="Openblock is already the latest version."
                                description="Prompt for already latest"
                                id="gui.updateModel.alreadyLatestTips"
                            />
                        </div>
                        <div className={styles.bottomArea}>
                            <button
                                className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                onClick={props.onCancel}
                            >
                                {close}
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.error) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="Operation failed"
                                description="Tile of update modal in error"
                                id="gui.updateModel.tileError"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            {props.updateState.info.message ? props.updateState.info.message : null}
                        </div>
                        <div className={styles.bottomArea}>
                            <button
                                className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                onClick={props.onCancel}
                            >
                                {close}
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdating) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="Upgrading external resource"
                                description="Tile of update modal in external resource upgrading"
                                id="gui.updateModel.upgradingExternalResource"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <div className={classNames(styles.updateInfoWrapper)}>
                                <div >
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.downloading ?
                                        downloading : null}
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.deleting ?
                                        (props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.zip ?
                                            <FormattedMessage
                                                defaultMessage="Deleting compressed file"
                                                description="Prompt for in deleting compressed file porgress"
                                                id="gui.updateModal.deletingCompressedFile"
                                            /> :
                                            <FormattedMessage
                                                defaultMessage="Deleting cache file"
                                                description="Prompt for in deleting cache file porgress"
                                                id="gui.updateModal.deletingCacheFile"
                                            />
                                        ) : null}
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.extracting ?
                                        <FormattedMessage
                                            defaultMessage="Extracting compressed file"
                                            description="Prompt for in extracting compressed file porgress"
                                            id="gui.updateModal.extractingCompressedFile"
                                        /> : null}
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.verifying ?
                                        (props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.zip ?
                                            <FormattedMessage
                                                defaultMessage="Verifying compressed file"
                                                description="Prompt for in verifying compressed file porgress"
                                                id="gui.updateModal.verifyingCompressedFile"
                                            /> :
                                            <FormattedMessage
                                                defaultMessage="Verifying cache file"
                                                description="Prompt for in verifying cache file porgress"
                                                id="gui.updateModal.verifyingCacheFile"
                                            />
                                        ) : null}
                                </div>
                                <div>
                                    {props.updateState.info.state ?
                                        <div >
                                            {props.updateState.info.state.speed}
                                        </div> : null}
                                </div>
                            </div>
                            <div className={classNames(styles.progressWrapper)}>
                                {progressBar(calculateProgressBarValue(props.updateState.info.progress))}
                            </div>
                            {props.updateState.info.state ?
                                <div className={classNames(styles.updateInfoWrapper)}>
                                    <div >
                                        {props.updateState.info.phase === RESOURCE_UPDATE_STATE.downloading ?
                                            props.updateState.info.state.name : null}
                                    </div>
                                    {props.updateState.info.state.done && props.updateState.info.state.total ?
                                        <div >
                                            {`${props.updateState.info.state.done}/` +
                                                `${props.updateState.info.state.total}`}
                                        </div> : null}
                                </div> : null}
                        </div>
                        <div className={styles.bottomArea}>
                            <button
                                className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                onClick={props.onCancel}
                                disabled={props.updateState.info.phase === RESOURCE_UPDATE_STATE.extracting ||
                                    (props.updateState.info.phase === RESOURCE_UPDATE_STATE.verifying &&
                                        props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.cache) ||
                                    (props.updateState.info.phase === RESOURCE_UPDATE_STATE.deleting &&
                                        (props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.errorCache ||
                                            props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.zip))}
                            >
                                {abort}
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdatFinish) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="External resource update complete"
                                description="Tile of update modal in external resource update finish"
                                id="gui.updateModel.tileResourceUpdateFinish"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <FormattedMessage
                                defaultMessage="External resource update complete, the application will automatically restart after 3 seconds." // eslint-disable-line max-len
                                description="Prompt for external resource update finish"
                                id="gui.updateModal.resourceUpdateFinishTips"
                            />
                        </div>
                        <div className={styles.bottomArea} />
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.applicationDownloading) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="Downloading application"
                                description="Tile of update modal in application downloading"
                                id="gui.updateModel.downloadingApplication"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <div className={classNames(styles.updateInfoWrapper)}>
                                <div >
                                    {downloading}
                                </div>
                                <div>
                                    {props.updateState.info.state ? props.updateState.info.state.speed : null}
                                </div>
                            </div>
                            <div className={classNames(styles.progressWrapper)}>
                                {progressBar(calculateProgressBarValue(props.updateState.info.progress))}
                            </div>
                            <div className={classNames(styles.updateInfoWrapper)}>
                                <div />
                                <div >
                                    {props.updateState.info.state ?
                                        (props.updateState.info.state.done && props.updateState.info.state.total ?
                                            `${props.updateState.info.state.done}/${props.updateState.info.state.total}` : // eslint-disable-line max-len
                                            null) :
                                        null}
                                </div>
                            </div>
                        </div>
                        <div className={styles.bottomArea}>
                            <button
                                className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                onClick={props.onCancel}
                            >
                                {abort}
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.applicationDownloadFinish) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="Application download complete"
                                description="Tile of update modal in application download finish"
                                id="gui.updateModel.tileApplicationDownloadFinish"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <FormattedMessage
                                defaultMessage="Application download complete, it will automatically quit and start installer after 3 seconds." // eslint-disable-line max-len
                                description="Prompt for application download finish"
                                id="gui.updateModal.applicationDownloadeFinishTips"
                            />
                        </div>
                        <div className={styles.bottomArea} />
                    </div>
                ) : null}
            </Box>
        </Modal>
    );
};

UpdateModalComponent.propTypes = {
    intl: intlShape,
    onClickUpdate: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    updateState: PropTypes.shape({
        phase: PropTypes.oneOf(Object.keys(UPDATE_MODAL_STATE)),
        info:
            PropTypes.shape({
                version: PropTypes.string,
                message: PropTypes.oneOf([PropTypes.object, PropTypes.string]),
                phase: PropTypes.string,
                progress: PropTypes.number,
                state: PropTypes.shape({
                    name: PropTypes.string,
                    speed: PropTypes.string,
                    total: PropTypes.string,
                    done: PropTypes.string
                })
            })
    })
};

export {
    UpdateModalComponent as default
};
