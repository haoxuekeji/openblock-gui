import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React from 'react';

import Box from '../box/box.jsx';
import Dots from './dots.jsx';
import helpIcon from './icons/help.svg';
import backIcon from './icons/back.svg';

import styles from './connection-modal.css';

const ErrorStep = props => (
    <Box className={styles.body}>
        <Box className={styles.activityArea}>
            <Box className={styles.centeredRow}>
                <div className={styles.peripheralActivity}>
                    <img
                        className={styles.peripheralActivityIcon}
                        src={props.connectionIconURL}
                    />
                </div>
            </Box>
        </Box>
        <Box className={styles.bottomArea}>
            {/* eslint-disable max-len */}
            {(props.isSerialport && (props.errorMessage === 'Access denied')) ? (
                <div className={classNames(styles.bottomAreaItem, styles.instructions)}>
                    <FormattedMessage
                        defaultMessage="Oops, serialport access denied, please check whether the serial port is occupied."
                        description="The device serialport connection process has encountered an 'Access denied' error."
                        id="gui.connection.accessDeniedError.errorMessage"
                    />
                </div>) :
                (props.isSerialport && (props.errorMessage === 'Unknown error code 31')) ? (
                    <div className={classNames(styles.bottomAreaItem, styles.instructions)}>
                        <FormattedMessage
                            defaultMessage="Oops, Unknown error code 31, it is recommended to re-plug the device."
                            description="The device serialport connection process has encountered an 'Unknown error code 31' error."
                            id="gui.connection.unknownErrorCode31.errorMessage"
                        />
                    </div>) :
                    (<div className={classNames(styles.bottomAreaItem, styles.instructions)}>
                        <FormattedMessage
                            defaultMessage="Oops, looks like something went wrong."
                            description="The device connection process has encountered an error."
                            id="gui.connection.error.errorMessage"
                        />
                    </div>)}

            <Dots
                error
                className={styles.bottomAreaItem}
                total={3}
            />
            <Box className={classNames(styles.bottomAreaItem, styles.buttonRow)}>
                <button
                    className={styles.connectionButton}
                    onClick={props.onScanning}
                >
                    <img
                        className={classNames(styles.buttonIconLeft, styles.buttonIconBack)}
                        src={backIcon}
                    />
                    <FormattedMessage
                        defaultMessage="Try again"
                        description="Button to initiate trying the device connection again after an error"
                        id="gui.connection.error.tryagainbutton"
                    />
                </button>
                <button
                    className={styles.connectionButton}
                    onClick={props.onHelp}
                >
                    <img
                        className={styles.buttonIconLeft}
                        src={helpIcon}
                    />
                    <FormattedMessage
                        defaultMessage="Help"
                        description="Button to view help content"
                        id="gui.connection.error.helpbutton"
                    />
                </button>
            </Box>
        </Box>
    </Box>
);

ErrorStep.propTypes = {
    connectionIconURL: PropTypes.string.isRequired,
    onHelp: PropTypes.func,
    onScanning: PropTypes.func,
    isSerialport: PropTypes.bool,
    errorMessage: PropTypes.string
};

export default ErrorStep;
