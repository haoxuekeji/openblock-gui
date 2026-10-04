/**
 * Alerts that can report a python exception raised on the board while a
 * realtime block ran; only one of them is on screen at a time.
 * @type {Array.<string>}
 */
const REALTIME_BOARD_ERROR_ALERT_IDS = [
    'realtimeBoardError',
    'realtimeBoardErrorNotReady',
    'realtimeBoardErrorNotFound'
];

// Extension guards raise "<module> is not initialized. Run the <module>
// init block first" (or connected / mounted / started / synchronized).
const NOT_READY_PATTERN = /\bis not (initialized|connected|mounted|started|synchronized)\b/i;

// A module that does not answer: driver "... not found (I2C scan: ...)"
// messages and the bare errno 19 an I2C transfer raises without an ACK.
const NOT_FOUND_PATTERN = /\bnot found\b|\bI2C scan\b|\bENODEV\b|\[Errno 19\]/i;

const MAX_LINE_LENGTH = 240;

/**
 * The line of a board traceback worth showing: the last one, carrying the
 * exception type and message.
 * @param {string} message - board stderr, usually a full traceback.
 * @return {string} - the last non-empty line, '' when there is none.
 */
const boardErrorLine = message => {
    const lines = String(message === null || typeof message === 'undefined' ? '' : message)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
    if (lines.length === 0) return '';
    const line = lines[lines.length - 1];
    return line.length > MAX_LINE_LENGTH ? `${line.slice(0, MAX_LINE_LENGTH - 1)}…` : line;
};

/**
 * Pick the alert whose text tells the child what to do about an error.
 * @param {string} line - the error line from boardErrorLine.
 * @return {string} - one of REALTIME_BOARD_ERROR_ALERT_IDS.
 */
const boardErrorAlertId = line => {
    if (NOT_READY_PATTERN.test(line)) return 'realtimeBoardErrorNotReady';
    if (NOT_FOUND_PATTERN.test(line)) return 'realtimeBoardErrorNotFound';
    return 'realtimeBoardError';
};

export {
    REALTIME_BOARD_ERROR_ALERT_IDS,
    boardErrorAlertId,
    boardErrorLine
};
