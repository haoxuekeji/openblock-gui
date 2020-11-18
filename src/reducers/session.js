
const SET_SESSION = 'session/SET_SESSION';
//登录状态
const initialState = {
    session: {
        user:{
            userid: 0,
            thumbnailUrl: '',
            nickname: '',
            username: '',
        }
    }
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_SESSION:
        return Object.assign({}, state, action.session);
    }
    return state;
};
const setSession = session => { 
    return {
        type: SET_SESSION,
        session: session
    }
};

export {
    reducer as default,
    initialState as initializedSession,
    setSession
};
