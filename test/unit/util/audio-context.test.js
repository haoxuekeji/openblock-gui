import WebAudioTestAPI from 'web-audio-test-api';
import SharedAudioContext from '../../../src/lib/audio/shared-audio-context';

// shared-audio-context 会通过 StartAudioContext 异步调用 context.resume()，
// web-audio-test-api 默认禁用状态迁移并异步抛错（拖垮整个 jest 进程），显式启用。
WebAudioTestAPI.setState({
    'AudioContext#suspend': 'enabled',
    'AudioContext#resume': 'enabled'
});

describe('Shared Audio Context', () => {
    const audioContext = new AudioContext();

    test('returns empty object without user gesture', () => {
        const sharedAudioContext = new SharedAudioContext();
        expect(sharedAudioContext).toMatchObject({});
    });

    test('returns AudioContext when mousedown is triggered', () => {
        const sharedAudioContext = new SharedAudioContext();
        const event = new Event('mousedown');
        document.dispatchEvent(event);
        expect(sharedAudioContext).toMatchObject(audioContext);
    });

    test('returns AudioContext when touchstart is triggered', () => {
        const sharedAudioContext = new SharedAudioContext();
        const event = new Event('touchstart');
        document.dispatchEvent(event);
        expect(sharedAudioContext).toMatchObject(audioContext);
    });
});
