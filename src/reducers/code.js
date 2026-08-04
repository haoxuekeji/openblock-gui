const UPDATE_CODE = 'scratch-gui/code/UPDATE_CODE';
const TOGGLE_LOCK = 'scratch-gui/code/TOGGLE_LOCK';

const initialState = {
    codeEditorValue: '// Monaco editor',
    isCodeEditorLocked: true,
    // Editor content captured at the moment of unlocking. Compared against
    // the current content when locking again to detect manual edits that
    // would be overwritten by the next block-generated code update.
    lockSnapshot: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case UPDATE_CODE:
        return Object.assign({}, state, {
            codeEditorValue: action.value
        });
    case TOGGLE_LOCK:
        return Object.assign({}, state, {
            isCodeEditorLocked: !state.isCodeEditorLocked,
            lockSnapshot: state.isCodeEditorLocked ? state.codeEditorValue : null
        });
    default:
        return state;
    }
};

const setCodeEditorValue = value => ({
    type: UPDATE_CODE,
    value: value
});

const toggleLock = () => ({
    type: TOGGLE_LOCK
});

export {
    reducer as default,
    initialState as codeInitialState,
    setCodeEditorValue,
    toggleLock
};
