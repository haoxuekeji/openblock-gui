import bindAll from 'lodash.bindall';

class HxLib {
    constructor () {
        // Bound so the methods can be handed straight to onClick instead of
        // being wrapped in an arrow at every call site (they need `this`).
        bindAll(this, [
            'isEnabled',
            'handleSpriteClick',
            'handleBackdropClick',
            'handleProjectClick',
            'handleSoundClick'
        ]);
    }
    _getConfig (type) {
        return window.scratchConfig && window.scratchConfig.hxlib && window.scratchConfig.hxlib[type];
    }
    isEnabled (type) {
        const config = this._getConfig(type);
        return !!(config && config.show);
    }
    handleSpriteClick () {
        const config = this._getConfig('sprite');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('sprite');
        }
    }
    handleBackdropClick () {
        const config = this._getConfig('backdrop');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('backdrop');
        }
    }
    handleProjectClick () {
        const config = this._getConfig('project');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('project');
        }
    }
    handleSoundClick () {
        const config = this._getConfig('sound');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('sound');
        }
    }
}

export default new HxLib();
