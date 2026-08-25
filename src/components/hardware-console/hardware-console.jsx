import React from 'react';
import {defineMessages, FormattedMessage, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ScrollableFeed from 'react-scrollable-feed';

import Box from '../box/box.jsx';
import MenuBarMenu from '../menu-bar/menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import styles from './hardware-console.css';
import cleanIcon from './clean.svg';
import settingIcon from './setting.svg';
import pauseIcon from './pause.svg';
import startIcon from './start.svg';
import interruptIcon from './interrupt.svg';
import resetIcon from './reset.svg';
import powerIcon from './power.svg';
import exportIcon from './export.svg';
import terminalIcon from './terminal.svg';
import monitorIcon from './monitor.svg';

const messages = defineMessages({
    interrupt: {
        defaultMessage: 'Interrupt program (Ctrl+C)',
        description: 'Button to send a keyboard interrupt to the MicroPython REPL',
        id: 'gui.hardwareConsole.interrupt'
    },
    softReset: {
        defaultMessage: 'Soft reboot (Ctrl+D)',
        description: 'Button to soft reboot the MicroPython board',
        id: 'gui.hardwareConsole.softReset'
    },
    hardReset: {
        defaultMessage: 'Restart board',
        description: 'Button to hard reset the board through the serial control lines',
        id: 'gui.hardwareConsole.hardReset'
    },
    exportLog: {
        defaultMessage: 'Export log',
        description: 'Button to download the received console data as a file',
        id: 'gui.hardwareConsole.exportLog'
    },
    boardFiles: {
        defaultMessage: 'Board files',
        description: 'Button to open the MicroPython board file manager',
        id: 'gui.hardwareConsole.boardFiles'
    },
    switchToMonitor: {
        defaultMessage: 'Switch to text monitor view',
        description: 'Button to switch the console to the plain text monitor view',
        id: 'gui.hardwareConsole.switchToMonitor'
    },
    switchToTerminal: {
        defaultMessage: 'Switch to interactive terminal view',
        description: 'Button to switch the console to the interactive terminal view',
        id: 'gui.hardwareConsole.switchToTerminal'
    },
    search: {
        defaultMessage: 'Search',
        description: 'Placeholder of the terminal search input',
        id: 'gui.hardwareConsole.search'
    },
    searchPrev: {
        defaultMessage: 'Previous match',
        description: 'Button to jump to the previous search match in the terminal',
        id: 'gui.hardwareConsole.searchPrev'
    },
    searchNext: {
        defaultMessage: 'Next match',
        description: 'Button to jump to the next search match in the terminal',
        id: 'gui.hardwareConsole.searchNext'
    },
    pause: {
        defaultMessage: 'Pause',
        description: 'Button to pause the console output',
        id: 'gui.hardwareConsole.pause'
    },
    clean: {
        defaultMessage: 'Clean',
        description: 'Button to clean the console output',
        id: 'gui.hardwareConsole.clean'
    },
    collapse: {
        defaultMessage: 'Collapse console',
        description: 'Button to collapse the docked hardware console',
        id: 'gui.hardwareConsole.collapse'
    }
});

const HardwareConsoleComponent = props => {
    const {
        baudrate,
        baudrateList,
        collapsible,
        consoleText,
        dataToSend,
        eol,
        eolList,
        intl,
        isAutoScroll,
        isHexForm,
        isMicroPython,
        isPause,
        isTerminalMode,
        isTimestamp,
        onBaudrateBlur,
        onBaudrateChange,
        onBaudrateKeyDown,
        onClickClean,
        onClickExport,
        onClickBoardFiles,
        onClickHardReset,
        onClickInterrupt,
        onClickPause,
        onClickSerialportMenu,
        onClickSoftReset,
        onClickToggleMode,
        onClickHexForm,
        onClickAutoScroll,
        onClickTimestamp,
        onClickSend,
        onInputChange,
        onKeyPress,
        onKeyDown,
        onRequestSerialportMenu,
        onSearchChange,
        onSearchKeyDown,
        onSearchNext,
        onSearchPrev,
        onClickCollapse,
        onSelectEol,
        searchValue,
        serialportMenuOpen,
        supportsHardReset,
        terminalRef
    } = props;
    return (
        <Box className={styles.hardwareConsoleWrapper}>
            <Box className={styles.toolbar}>
                {isMicroPython ? (
                    <React.Fragment>
                        <button
                            className={classNames(styles.button, styles.toolbarButton)}
                            title={intl.formatMessage(messages.interrupt)}
                            onClick={onClickInterrupt}
                        >
                            <img
                                alt={intl.formatMessage(messages.interrupt)}
                                className={styles.toolbarIcon}
                                src={interruptIcon}
                            />
                        </button>
                        <button
                            className={classNames(styles.button, styles.toolbarButton)}
                            title={intl.formatMessage(messages.softReset)}
                            onClick={onClickSoftReset}
                        >
                            <img
                                alt={intl.formatMessage(messages.softReset)}
                                className={styles.toolbarIcon}
                                src={resetIcon}
                            />
                        </button>
                        <button
                            className={classNames(styles.button, styles.toolbarButton)}
                            title={intl.formatMessage(messages.boardFiles)}
                            onClick={onClickBoardFiles}
                        >
                            <img
                                alt={intl.formatMessage(messages.boardFiles)}
                                className={styles.toolbarIcon}
                                src={exportIcon}
                            />
                        </button>
                        <span className={styles.toolbarDivider} />
                    </React.Fragment>
                ) : null}
                {supportsHardReset ? (
                    <button
                        className={classNames(styles.button, styles.toolbarButton)}
                        title={intl.formatMessage(messages.hardReset)}
                        onClick={onClickHardReset}
                    >
                        <img
                            alt={intl.formatMessage(messages.hardReset)}
                            className={styles.toolbarIcon}
                            src={powerIcon}
                        />
                    </button>
                ) : null}
                <button
                    className={classNames(styles.button, styles.toolbarButton)}
                    title={intl.formatMessage(
                        isTerminalMode ? messages.switchToMonitor : messages.switchToTerminal)}
                    onClick={onClickToggleMode}
                >
                    <img
                        alt={intl.formatMessage(
                            isTerminalMode ? messages.switchToMonitor : messages.switchToTerminal)}
                        className={styles.toolbarIcon}
                        src={isTerminalMode ? monitorIcon : terminalIcon}
                    />
                </button>
                <button
                    className={classNames(styles.button, styles.toolbarButton)}
                    title={intl.formatMessage(messages.exportLog)}
                    onClick={onClickExport}
                >
                    <img
                        alt={intl.formatMessage(messages.exportLog)}
                        className={styles.toolbarIcon}
                        src={exportIcon}
                    />
                </button>
                {isTerminalMode ? (
                    <Box className={styles.searchBox}>
                        <input
                            className={styles.searchInput}
                            placeholder={intl.formatMessage(messages.search)}
                            value={searchValue}
                            onChange={onSearchChange}
                            onKeyDown={onSearchKeyDown}
                        />
                        <button
                            className={classNames(styles.button, styles.searchButton)}
                            title={intl.formatMessage(messages.searchPrev)}
                            onClick={onSearchPrev}
                        >
                            {'\u25B2'}
                        </button>
                        <button
                            className={classNames(styles.button, styles.searchButton)}
                            title={intl.formatMessage(messages.searchNext)}
                            onClick={onSearchNext}
                        >
                            {'\u25BC'}
                        </button>
                    </Box>
                ) : null}
                <Box className={styles.toolbarSpacer} />
                <button
                    className={classNames(styles.button, styles.toolbarButton)}
                    title={intl.formatMessage(messages.pause)}
                    onClick={onClickPause}
                >
                    <img
                        alt={intl.formatMessage(messages.pause)}
                        className={styles.toolbarIcon}
                        src={isPause ? startIcon : pauseIcon}
                    />
                </button>
                <button
                    className={classNames(styles.button, styles.toolbarButton)}
                    title={intl.formatMessage(messages.clean)}
                    onClick={onClickClean}
                >
                    <img
                        alt={intl.formatMessage(messages.clean)}
                        className={styles.toolbarIcon}
                        src={cleanIcon}
                    />
                </button>
                {collapsible ? (
                    <button
                        className={classNames(styles.button, styles.toolbarButton, styles.collapseButton)}
                        title={intl.formatMessage(messages.collapse)}
                        onClick={onClickCollapse}
                    >
                        {'\u25BC'}
                    </button>
                ) : null}
            </Box>
            {isTerminalMode ? (
                <Box className={styles.terminalWrapper}>
                    <div
                        className={styles.terminal}
                        ref={terminalRef}
                    />
                </Box>
            ) : (
                <Box className={styles.consoleArray}>
                    <ScrollableFeed
                        forceScroll={isAutoScroll}
                    >
                        <span>
                            {consoleText}
                        </span>
                    </ScrollableFeed>
                </Box>
            )}
            <Box className={styles.consoleMenuWarpper}>
                {isTerminalMode ? (
                    <span className={styles.terminalHint}>
                        <FormattedMessage
                            defaultMessage="Click the terminal and type to interact with the REPL"
                            description="Hint shown under the interactive terminal"
                            id="gui.hardwareConsole.terminalHint"
                        />
                    </span>
                ) : (
                    <React.Fragment>
                        <input
                            className={styles.consoleInput}
                            value={dataToSend}
                            onChange={onInputChange}
                            onKeyPress={onKeyPress}
                            onKeyDown={onKeyDown}
                        />
                        <button
                            className={classNames(styles.button, styles.sendButton)}
                            onClick={onClickSend}
                        >
                            <FormattedMessage
                                defaultMessage="Send"
                                description="Button in bottom to send data to serialport"
                                id="gui.hardwareConsole.send"
                            />
                        </button>
                    </React.Fragment>
                )}
                <button
                    className={classNames(styles.button, styles.settingButton)}
                >
                    <img
                        alt="Setting"
                        className={classNames(styles.settingIcon, {
                            [styles.active]: serialportMenuOpen
                        })}
                        src={settingIcon}
                        onMouseUp={onClickSerialportMenu}
                    />
                    <MenuBarMenu
                        className={classNames(styles.MenuBarMenu)}
                        menuClassName={styles.menu}
                        open={serialportMenuOpen}
                        place={'left'}
                        directiron={'up'}
                        onRequestClose={onRequestSerialportMenu}
                    >
                        <MenuSection >
                            <MenuItem
                                isRtl={props.isRtl}
                            >
                                <FormattedMessage
                                    defaultMessage="Buadrate"
                                    description="Serial buadrate."
                                    id="gui.hardwareConsole.buadrate"
                                />
                                <input
                                    className={styles.baudrateInput}
                                    inputMode="numeric"
                                    list="hardware-console-baudrate-options"
                                    value={baudrate}
                                    onBlur={onBaudrateBlur}
                                    onChange={onBaudrateChange}
                                    onKeyDown={onBaudrateKeyDown}
                                />
                                <datalist id="hardware-console-baudrate-options">
                                    {baudrateList.map(item => (
                                        <option
                                            key={item.key}
                                            value={item.key}
                                        />
                                    ))}
                                </datalist>
                            </MenuItem>
                            {isTerminalMode ? null : (
                                <MenuItem
                                    isRtl={props.isRtl}
                                >
                                    <FormattedMessage
                                        defaultMessage="End of line"
                                        description="End of line."
                                        id="gui.hardwareConsole.endOfLine"
                                    />
                                    <select
                                        onChange={onSelectEol}
                                    >
                                        {eolList.map(item => (
                                            <option
                                                key={item.key}
                                                selected={eol === item.key}
                                            >
                                                {intl.formatMessage(item.value)}
                                            </option>
                                        ))}
                                    </select>
                                </MenuItem>
                            )}
                        </MenuSection>
                        {isTerminalMode ? null : (
                            <MenuSection >
                                <MenuItem
                                    onClick={onClickHexForm}
                                    isRtl={props.isRtl}
                                >
                                    <FormattedMessage
                                        defaultMessage="Hex form"
                                        description="Display serial port data in hexadecimal."
                                        id="gui.hardwareConsole.hexform"
                                    />
                                    <input
                                        type="checkbox"
                                        name="hexform"
                                        checked={isHexForm}
                                        readOnly
                                    />
                                </MenuItem>
                                <MenuItem
                                    onClick={onClickTimestamp}
                                    isRtl={props.isRtl}
                                >
                                    <FormattedMessage
                                        defaultMessage="Show timestamp"
                                        description="Prefix each console line with a receive timestamp."
                                        id="gui.hardwareConsole.timestamp"
                                    />
                                    <input
                                        type="checkbox"
                                        name="timestamp"
                                        checked={isTimestamp}
                                        readOnly
                                    />
                                </MenuItem>
                                <MenuItem
                                    onClick={onClickAutoScroll}
                                    isRtl={props.isRtl}
                                    bottomLine
                                >
                                    <FormattedMessage
                                        defaultMessage="Auto scroll"
                                        description="Auto scroll serialport console data."
                                        id="gui.hardwareConsole.autoScroll"
                                    />
                                    <input
                                        type="checkbox"
                                        name="autoScroll"
                                        checked={isAutoScroll}
                                        readOnly
                                    />
                                </MenuItem>
                            </MenuSection>
                        )}
                    </MenuBarMenu>
                </button>
            </Box>
        </Box>
    );
};

HardwareConsoleComponent.propTypes = {
    baudrate: PropTypes.string.isRequired,
    collapsible: PropTypes.bool,
    onClickCollapse: PropTypes.func,
    baudrateList: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired
        })),
    consoleText: PropTypes.string,
    dataToSend: PropTypes.string,
    eol: PropTypes.string.isRequired,
    eolList: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            value: PropTypes.shape({
                defaultMessage: PropTypes.string.isRequired,
                description: PropTypes.string,
                id: PropTypes.string.isRequired
            })
        })),
    intl: intlShape,
    isRtl: PropTypes.bool,
    isHexForm: PropTypes.bool.isRequired,
    isMicroPython: PropTypes.bool,
    isPause: PropTypes.bool.isRequired,
    isAutoScroll: PropTypes.bool.isRequired,
    isTerminalMode: PropTypes.bool,
    isTimestamp: PropTypes.bool,
    onBaudrateBlur: PropTypes.func.isRequired,
    onBaudrateChange: PropTypes.func.isRequired,
    onBaudrateKeyDown: PropTypes.func.isRequired,
    onClickClean: PropTypes.func.isRequired,
    onClickExport: PropTypes.func,
    onClickBoardFiles: PropTypes.func,
    onClickHardReset: PropTypes.func,
    onClickInterrupt: PropTypes.func,
    onClickPause: PropTypes.func.isRequired,
    onClickAutoScroll: PropTypes.func.isRequired,
    onClickHexForm: PropTypes.func.isRequired,
    onClickTimestamp: PropTypes.func,
    onClickSend: PropTypes.func.isRequired,
    onClickSerialportMenu: PropTypes.func.isRequired,
    onClickSoftReset: PropTypes.func,
    onClickToggleMode: PropTypes.func,
    onInputChange: PropTypes.func.isRequired,
    onKeyPress: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    onRequestSerialportMenu: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func,
    onSearchKeyDown: PropTypes.func,
    onSearchNext: PropTypes.func,
    onSearchPrev: PropTypes.func,
    onSelectEol: PropTypes.func.isRequired,
    searchValue: PropTypes.string,
    serialportMenuOpen: PropTypes.bool.isRequired,
    supportsHardReset: PropTypes.bool,
    terminalRef: PropTypes.func
};

export default HardwareConsoleComponent;
