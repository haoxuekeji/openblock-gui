import React from 'react';
import PropTypes from 'prop-types';
import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import classNames from 'classnames';
import {defineMessages, FormattedMessage, intlShape} from 'react-intl';

import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants';
import {getStageDimensions} from '../../lib/screen-utils.js';

import styles from './hardware-header.css';

import largeStageIcon from './icon--large-stage.svg';
import smallStageIcon from './icon--small-stage.svg';
import hideStageIcon from './icon--hide-stage.svg';
import uploadIcon from './icon--upload.svg';

const messages = defineMessages({
    uploadMessage: {
        defaultMessage: 'Upload',
        description: 'Button to upload program',
        id: 'gui.hardwareHeader.upload'
    },
    largeStageSizeMessage: {
        defaultMessage: 'Switch to large stage',
        description: 'Button to upload code to device alt',
        id: 'gui.stageHeader.codeStageSizeLarge'
    },
    smallStageSizeMessage: {
        defaultMessage: 'Switch to small stage',
        description: 'Button to change stage size to small',
        id: 'gui.stageHeader.codeStageSizeSmall'
    },
    hideStageSizeMessage: {
        defaultMessage: 'Hide stage',
        description: 'Button to hide stage',
        id: 'gui.stageHeader.hideStage'
    }
});

const HardwareHeaderComponent = props => {
    const {
        onSetStageLarge,
        onSetStageSmall,
        onSetStageHide,
        onUpload,
        stageSize
    } = props;
    const stageDimensions = getStageDimensions(stageSize === STAGE_DISPLAY_SIZES.hide ?
        STAGE_DISPLAY_SIZES.small : stageSize, null);
    return (
        <Box
            className={classNames(
                styles.hardwareHeaderWrapper
            )}
            style={{width: stageDimensions.width + 2}}
        >
            <div className={styles.uploadGroup}>
                <div
                    className={classNames(
                        styles.uploadButton,
                    )}
                    onClick={onUpload}
                >
                    <img
                        alt={props.intl.formatMessage(messages.uploadMessage)}
                        className={styles.uploadIcon}
                        draggable={false}
                        src={uploadIcon}
                    />
                    <FormattedMessage
                        defaultMessage="Upload"
                        description="Button to upload program"
                        id="gui.hardwareHeader.upload"
                    />
                </div>
            </div>
            <div className={styles.stageSizeToggleGroup}>
                <div>
                    <Button
                        className={classNames(
                            styles.stageButton,
                            styles.stageButtonFirst,
                            (stageSize === STAGE_DISPLAY_SIZES.small) ? null : styles.stageButtonToggledOff
                        )}
                        onClick={onSetStageSmall}
                    >
                        <img
                            alt={props.intl.formatMessage(messages.smallStageSizeMessage)}
                            className={styles.stageButtonIcon}
                            draggable={false}
                            src={smallStageIcon}
                        />
                    </Button>
                </div>
                <div>
                    <Button
                        className={classNames(
                            styles.stageButton,
                            styles.stageButtonLast,
                            (stageSize === STAGE_DISPLAY_SIZES.large) ? null : styles.stageButtonToggledOff
                        )}
                        onClick={onSetStageLarge}
                    >
                        <img
                            alt={props.intl.formatMessage(messages.largeStageSizeMessage)}
                            className={styles.stageButtonIcon}
                            draggable={false}
                            src={largeStageIcon}
                        />
                    </Button>
                </div>
            </div>
            <div className={styles.stageHideGroup}>
                <div>
                    <Button
                        className={classNames(
                            styles.stageButton,
                            (stageSize === STAGE_DISPLAY_SIZES.hide) ? null : styles.stageButtonToggledOff
                        )}
                        onClick={onSetStageHide}
                    >
                        <img
                            alt={props.intl.formatMessage(messages.hideStageSizeMessage)}
                            className={styles.stageButtonIcon}
                            draggable={false}
                            src={hideStageIcon}
                        />
                    </Button>
                </div>
            </div>
        </Box>
    );
};

HardwareHeaderComponent.propTypes = {
    intl: intlShape,
    onUpload: PropTypes.func.isRequired,
    onSetStageLarge: PropTypes.func.isRequired,
    onSetStageSmall: PropTypes.func.isRequired,
    onSetStageHide: PropTypes.func.isRequired,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired
};

export default HardwareHeaderComponent;
