const SET_VISIBLE = 'scratch-gui/code-preview/SET_VISIBLE';
const SET_CONTENT = 'scratch-gui/code-preview/SET_CONTENT';

// Persist the toggle so a classroom-wide "open the code preview" instruction
// survives page reloads (see FUN-001B task card).
const STORAGE_KEY = 'openblock:code-preview-visible';

const readPersistedVisible = () => {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
        // Storage can be unavailable (privacy mode, iframe sandbox); treat
        // as default-off rather than crashing the GUI.
        return false;
    }
};

const persistVisible = visible => {
    try {
        window.localStorage.setItem(STORAGE_KEY, visible ? 'true' : 'false');
    } catch (e) {
        // Ignore storage failures, the toggle still works for the session.
    }
};

const initialState = {
    visible: readPersistedVisible(),
    code: '',
    unsupportedTotal: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_VISIBLE:
        return Object.assign({}, state, {
            visible: action.visible
        });
    case SET_CONTENT:
        return Object.assign({}, state, {
            code: action.code,
            unsupportedTotal: action.unsupportedTotal
        });
    default:
        return state;
    }
};

const setCodePreviewVisible = visible => {
    persistVisible(visible);
    return {
        type: SET_VISIBLE,
        visible: visible
    };
};

const setCodePreviewContent = ({code, unsupportedTotal}) => ({
    type: SET_CONTENT,
    code: code,
    unsupportedTotal: unsupportedTotal
});

export {
    reducer as default,
    initialState as codePreviewInitialState,
    setCodePreviewVisible,
    setCodePreviewContent
};
