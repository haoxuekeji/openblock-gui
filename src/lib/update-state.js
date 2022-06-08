import KeyMirror from 'keymirror';

const UPDATE_TARGET = KeyMirror({
    application: null,
    resource: null
});

const UPDATE_MODAL_STATE = KeyMirror({
    checkingApplication: null,
    checkingResource: null,
    applicationUpdateAvailable: null,
    resourceUpdateAvailable: null,
    applicationDownloading: null,
    resourceUpdating: null,
    applicationDownloadFinish: null,
    resourceUpdatFinish: null,
    latest: null,
    error: null,
    abort: null
});

const RESOURCE_UPDATE_STATE = KeyMirror({
    downloading: null,
    deleting: null,
    extracting: null,
    verifying: null
});

const RESOURCE_UPDATE_CONTENT = KeyMirror({
    zip: null,
    cache: null
});

export {
    UPDATE_TARGET,
    UPDATE_MODAL_STATE,
    RESOURCE_UPDATE_STATE,
    RESOURCE_UPDATE_CONTENT
};
