const SET_NAME = 'scratch-gui/connection-modal/setName';
const CLEAR_NAME = 'scratch-gui/connection-modal/clearName';
const SET_REALTIME_PROTOCAL_CONNECTION = 'scratch-gui/connection-modal/setRealtimeConnection';
const SET_LIST_ALL = 'scratch-gui/connection-modal/setListAll';
const SET_LIVE_UNAVAILABLE = 'scratch-gui/connection-modal/setLiveUnavailable';

const initialState = {
    peripheralName: null,
    realtimeConnection: false,
    isListAll: false,
    // 设备仍连接但实时命令通道暂不可用(积木读数返回空):菜单栏黄点提示。
    liveUnavailable: false
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_NAME:
        return Object.assign({}, state, {
            peripheralName: action.peripheralName
        });
    case CLEAR_NAME:
        return Object.assign({}, state, {
            peripheralName: null
        });
    case SET_REALTIME_PROTOCAL_CONNECTION:
        return Object.assign({}, state, {
            realtimeConnection: action.isConnected
        });
    case SET_LIST_ALL:
        return Object.assign({}, state, {
            isListAll: action.isListAll
        });
    case SET_LIVE_UNAVAILABLE:
        return Object.assign({}, state, {
            liveUnavailable: action.liveUnavailable
        });
    default:
        return state;
    }
};

const setConnectionModalPeripheralName = function (peripheralName) {
    return {
        type: SET_NAME,
        peripheralName: peripheralName
    };
};

const clearConnectionModalPeripheralName = function () {
    return {
        type: CLEAR_NAME
    };
};

const setRealtimeConnection = function (isConnected) {
    return {
        type: SET_REALTIME_PROTOCAL_CONNECTION,
        isConnected: isConnected
    };
};

const setListAll = function (isListAll) {
    return {
        type: SET_LIST_ALL,
        isListAll: isListAll
    };
};

const setLiveUnavailable = function (liveUnavailable) {
    return {
        type: SET_LIVE_UNAVAILABLE,
        liveUnavailable: liveUnavailable
    };
};

export {
    reducer as default,
    initialState as connectionModalInitialState,
    setConnectionModalPeripheralName,
    clearConnectionModalPeripheralName,
    setRealtimeConnection,
    setListAll,
    setLiveUnavailable
};
