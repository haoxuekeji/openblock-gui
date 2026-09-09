const SET_NAME = 'scratch-gui/connection-modal/setName';
const CLEAR_NAME = 'scratch-gui/connection-modal/clearName';
const SET_REALTIME_PROTOCAL_CONNECTION = 'scratch-gui/connection-modal/setRealtimeConnection';
const SET_LIST_ALL = 'scratch-gui/connection-modal/setListAll';
const SET_LIVE_UNAVAILABLE = 'scratch-gui/connection-modal/setLiveUnavailable';
const SET_TARGET = 'scratch-gui/connection-modal/setTarget';

const initialState = {
    peripheralName: null,
    realtimeConnection: false,
    isListAll: false,
    // 设备仍连接但实时命令通道暂不可用(积木读数返回空):菜单栏黄点提示。
    // reason 区分成因:'channel' 会话重建中,'interrupt-failed' 板上程序停不下来
    // (提示文案与弹窗不同);通道恢复或断开时一并清空。
    liveUnavailable: false,
    liveUnavailableReason: null,
    // 连接弹窗面向的外设:带自有连接流程的 Scratch 扩展 id(如 wedo2),
    // 为空时面向已选硬件设备。此前扩展的状态按钮会把扩展 id 写进 device
    // 槽位(deviceName/deviceType 置空),连带搞乱菜单栏与代码生成。
    targetId: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_TARGET:
        return Object.assign({}, state, {
            targetId: action.targetId
        });
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
            liveUnavailable: action.liveUnavailable,
            liveUnavailableReason: action.liveUnavailable ? (action.reason || 'channel') : null
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

/**
 * Flag the realtime command channel as unusable (or usable again).
 * @param {boolean} liveUnavailable - true while blocks get no data.
 * @param {?string} reason - 'channel' (session being rebuilt) or
 *   'interrupt-failed' (the program on the board could not be stopped);
 *   ignored when liveUnavailable is false.
 * @return {object} - the action.
 */
const setLiveUnavailable = function (liveUnavailable, reason = null) {
    return {
        type: SET_LIVE_UNAVAILABLE,
        liveUnavailable: liveUnavailable,
        reason: reason
    };
};

/**
 * Point the connection modal at a peripheral.
 * @param {?string} targetId - extension id of a Scratch extension with
 *   its own peripheral (e.g. 'wedo2'), or null for the selected hardware
 *   device.
 * @return {object} - the action.
 */
const setConnectionModalTarget = function (targetId) {
    return {
        type: SET_TARGET,
        targetId: targetId || null
    };
};

export {
    reducer as default,
    initialState as connectionModalInitialState,
    setConnectionModalPeripheralName,
    clearConnectionModalPeripheralName,
    setConnectionModalTarget,
    setRealtimeConnection,
    setListAll,
    setLiveUnavailable
};
