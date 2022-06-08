const SET_UPDATE = 'scratch-gui/update/SET_UPDATE';
const CLEAR_UPDATE = 'scratch-gui/update/CLEAR_UPDATE';

const initialState = {
    updateState: {
        phase: null,
        info: null
    }
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_UPDATE:
        return Object.assign({}, state, {
            updateState: action.updateState
        });
    case CLEAR_UPDATE:
        return Object.assign({}, state, {
            updateState: initialState.updateState
        });
    default:
        return state;
    }
};

const setUpdate = function (updateState) {
    return {
        type: SET_UPDATE,
        updateState: updateState
    };
};

const clearUpdate = function () {
    return {
        type: CLEAR_UPDATE
    };
};

export {
    reducer as default,
    initialState as updateInitialState,
    setUpdate,
    clearUpdate
};
