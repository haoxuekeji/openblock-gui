

class HX_Lib {
    _getConfig (type) {
        return window.scratchConfig && window.scratchConfig.hxlib && window.scratchConfig.hxlib[type];
    }
    isEnabled (type) {
        const config = this._getConfig(type);
        return !!(config && config.show);
    }
    onSpriteClick () {
        const config = this._getConfig('sprite');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('sprite');
        }
    }
    onBackdropClick () {
        const config = this._getConfig('backdrop');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('backdrop');
        }
    }
    opProjectClick () {
        const config = this._getConfig('project');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('project');
        }
    }
    onSoundClick () {
        const config = this._getConfig('sound');
        if (config && typeof config.handleClick === 'function') {
            config.handleClick('sound');
        }
    }
}
export default new HX_Lib()
