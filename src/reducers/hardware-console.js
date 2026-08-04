const SET_BUADRATE = 'scratch-gui/hardware-console/setBaudrate';
const SET_EOL = 'scratch-gui/hardware-console/setEol';
const SWITCH_HEXFORM = 'scratch-gui/hardware-console/switchHexForm';
const SWITCH_AUTOSCROLL = 'scratch-gui/hardware-console/switchAutoScroll';
const SWITCH_PAUSE = 'scratch-gui/hardware-console/switchPause';
const SET_DISPLAY_MODE = 'scratch-gui/hardware-console/setDisplayMode';
const SWITCH_TIMESTAMP = 'scratch-gui/hardware-console/switchTimestamp';

const DISPLAY_MODE_TERMINAL = 'terminal';
const DISPLAY_MODE_MONITOR = 'monitor';

const initialState = {
    baudrate: '115200',
    eol: 'lfAndCr',
    isHexForm: false,
    isAutoScroll: true,
    isPause: false,
    // null means "auto": terminal for MicroPython devices, monitor otherwise.
    displayMode: null,
    isTimestamp: false
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_BUADRATE:
        return Object.assign({}, state, {
            baudrate: action.baudrate
        });
    case SET_EOL:
        return Object.assign({}, state, {
            eol: action.eol
        });
    case SWITCH_HEXFORM:
        return Object.assign({}, state, {
            isHexForm: !state.isHexForm
        });
    case SWITCH_AUTOSCROLL:
        return Object.assign({}, state, {
            isAutoScroll: !state.isAutoScroll
        });
    case SWITCH_PAUSE:
        return Object.assign({}, state, {
            isPause: !state.isPause
        });
    case SET_DISPLAY_MODE:
        return Object.assign({}, state, {
            displayMode: action.displayMode
        });
    case SWITCH_TIMESTAMP:
        return Object.assign({}, state, {
            isTimestamp: !state.isTimestamp
        });
    default:
        return state;
    }
};

const setBaudrate = function (baudrate) {
    return {
        type: SET_BUADRATE,
        baudrate: baudrate
    };
};

const setEol = function (eol) {
    return {
        type: SET_EOL,
        eol: eol
    };
};

const switchHexForm = function () {
    return {
        type: SWITCH_HEXFORM
    };
};

const switchAutoScroll = function () {
    return {
        type: SWITCH_AUTOSCROLL
    };
};

const switchPause = function () {
    return {
        type: SWITCH_PAUSE
    };
};

const setDisplayMode = function (displayMode) {
    return {
        type: SET_DISPLAY_MODE,
        displayMode: displayMode
    };
};

const switchTimestamp = function () {
    return {
        type: SWITCH_TIMESTAMP
    };
};

export {
    reducer as default,
    initialState as hardwareConsoleInitialState,
    setBaudrate,
    setEol,
    switchHexForm,
    switchAutoScroll,
    switchPause,
    setDisplayMode,
    switchTimestamp,
    DISPLAY_MODE_TERMINAL,
    DISPLAY_MODE_MONITOR
};
