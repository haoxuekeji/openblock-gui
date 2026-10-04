import {
    REALTIME_BOARD_ERROR_ALERT_IDS,
    boardErrorAlertId,
    boardErrorLine
} from '../../../src/lib/realtime-board-error';
import alertsData from '../../../src/lib/alerts/index.jsx';

const traceback = line => 'Traceback (most recent call last):\r\n' +
    '  File "<stdin>", line 3, in <module>\r\n' +
    `${line}\r\n`;

describe('boardErrorLine', () => {
    test('keeps the exception line of a traceback', () => {
        const line = 'RuntimeError: OLED is not initialized. Run the OLED init block first';
        expect(boardErrorLine(traceback(line))).toEqual(line);
    });

    test('handles bare messages and empty input', () => {
        const bare = 'MemoryError: memory allocation failed';
        expect(boardErrorLine(bare)).toEqual(bare);
        expect(boardErrorLine('\r\n  \r\n')).toEqual('');
        expect(boardErrorLine(null)).toEqual('');
        expect(boardErrorLine()).toEqual('');
    });

    test('caps very long lines', () => {
        const line = boardErrorLine(`ValueError: ${'x'.repeat(500)}`);
        expect(line.length).toEqual(240);
        expect(line.endsWith('…')).toBe(true);
    });
});

describe('boardErrorAlertId', () => {
    test('modules whose init / connect block has not run', () => {
        [
            'RuntimeError: OLED is not initialized. Run the OLED init block first',
            'RuntimeError: MQTT is not connected. Run the connect block first',
            'RuntimeError: SD card is not mounted. Run the SD mount block first',
            'RuntimeError: Web remote is not started. Run a start Web remote block first',
            'RuntimeError: NTP time is not synchronized. Run the sync block first',
            'RuntimeError: Servo on pin 13 is not initialized'
        ].forEach(line => {
            expect(boardErrorAlertId(line)).toEqual('realtimeBoardErrorNotReady');
        });
    });

    test('modules that do not answer', () => {
        [
            'OSError: SSD1306 OLED not found (I2C scan: 0x27)',
            'OSError: DS18B20 sensor not found on pin 4',
            'OSError: TM1650 write failed at 0x24 (I2C scan: none). Check SDA/SCL, power and wiring: [Errno 19] ENODEV',
            'OSError: [Errno 19] ENODEV'
        ].forEach(line => {
            expect(boardErrorAlertId(line)).toEqual('realtimeBoardErrorNotFound');
        });
    });

    test('everything else gets the generic alert', () => {
        [
            'ValueError: invalid pin',
            'OSError: MQTT publish failed: [Errno 104] ECONNRESET',
            "NameError: name '_ob_x' isn't defined",
            ''
        ].forEach(line => {
            expect(boardErrorAlertId(line)).toEqual('realtimeBoardError');
        });
    });

    test('every alert id has a definition that clears the others', () => {
        REALTIME_BOARD_ERROR_ALERT_IDS.forEach(alertId => {
            const alert = alertsData.find(data => data.alertId === alertId);
            expect(alert).toBeDefined();
            expect(alert.closeButton).toBe(true);
            expect(alert.clearList).toEqual(REALTIME_BOARD_ERROR_ALERT_IDS);
        });
    });
});
