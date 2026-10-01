import {isLinkTransport} from '../../../src/containers/connection-modal.jsx';

describe('isLinkTransport', () => {
    const vmWithTransport = transportId => ({getPeripheralTransport: () => transportId});

    test('devices without connection methods (Arduino boards) go through Link', () => {
        expect(isLinkTransport(null, vmWithTransport(null), 'arduinoUno')).toBe(true);
        expect(isLinkTransport(null, vmWithTransport('link'), 'arduinoUno')).toBe(true);
        expect(isLinkTransport(null, {}, 'arduinoUno')).toBe(true);
    });

    test('a device whose active transport is Web Serial does not', () => {
        expect(isLinkTransport(null, vmWithTransport('webserial'), 'esp32')).toBe(false);
    });

    test('the selected method decides when there is one', () => {
        expect(isLinkTransport({id: 'link'}, vmWithTransport('webserial'), 'esp32')).toBe(true);
        expect(isLinkTransport({id: 'webserial'}, vmWithTransport('link'), 'esp32')).toBe(false);
    });
});
