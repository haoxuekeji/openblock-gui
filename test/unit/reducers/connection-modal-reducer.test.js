/* eslint-env jest */
import connectionModalReducer, {
    connectionModalInitialState,
    setConnectionModalTarget,
    setConnectionModalPeripheralName,
    clearConnectionModalPeripheralName
} from '../../../src/reducers/connection-modal';

test('initialState targets the hardware device and shows no peripheral', () => {
    let defaultState;
    /* connectionModalReducer(state, action) */
    expect(connectionModalReducer(defaultState, {type: 'anything'})).toBeDefined();
    expect(connectionModalReducer(defaultState, {type: 'anything'})).toEqual(connectionModalInitialState);
    expect(connectionModalInitialState.targetId).toBeNull();
    expect(connectionModalInitialState.peripheralName).toBeNull();
});

test('setConnectionModalTarget points the modal at a Scratch extension peripheral', () => {
    const state = connectionModalReducer(connectionModalInitialState, setConnectionModalTarget('wedo2'));
    expect(state.targetId).toBe('wedo2');
});

test('setConnectionModalTarget without an id falls back to the hardware device', () => {
    const targeted = connectionModalReducer(connectionModalInitialState, setConnectionModalTarget('wedo2'));
    expect(connectionModalReducer(targeted, setConnectionModalTarget()).targetId).toBeNull();
    expect(connectionModalReducer(targeted, setConnectionModalTarget(null)).targetId).toBeNull();
});

test('peripheral name updates leave the target alone', () => {
    const targeted = connectionModalReducer(connectionModalInitialState, setConnectionModalTarget('wedo2'));
    const named = connectionModalReducer(targeted, setConnectionModalPeripheralName('LPF2 Smart Hub'));
    expect(named.peripheralName).toBe('LPF2 Smart Hub');
    expect(named.targetId).toBe('wedo2');
    const cleared = connectionModalReducer(named, clearConnectionModalPeripheralName());
    expect(cleared.peripheralName).toBeNull();
    expect(cleared.targetId).toBe('wedo2');
});
