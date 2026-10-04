import React from 'react';
import configureStore from 'redux-mock-store';
import {mount} from 'enzyme';
import VM from 'openblock-vm';

import vmListenerHOC from '../../../src/lib/vm-listener-hoc.jsx';
import {guiInitialState} from '../../../src/reducers/gui';

describe('VMListenerHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    beforeEach(() => {
        vm = new VM();
        // 以真实 guiInitialState 打底，保证 mapStateToProps 读取的
        // deviceData / projectChanged 等 openblock 新增键存在
        store = mockStore({
            scratchGui: {
                ...guiInitialState,
                mode: {},
                modals: {},
                vm: vm
            }
        });
    });

    test('vm green flag event is bound to the passed in prop callback', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        const onGreenFlag = jest.fn();
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
                onGreenFlag={onGreenFlag}
            />
        );
        expect(onGreenFlag).not.toHaveBeenCalled();
        vm.emit('PROJECT_START');
        expect(onGreenFlag).toHaveBeenCalled();
    });

    test('onGreenFlag is not passed to the children', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        const wrapper = mount(
            <WrappedComponent
                store={store}
                vm={vm}
                onGreenFlag={jest.fn()}
            />
        );
        const child = wrapper.find(Component);
        expect(child.props().onGreenFlag).toBeUndefined();
    });

    test('targetsUpdate event from vm triggers targets update action', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        const targetList = [];
        const editingTarget = 'id';
        vm.emit('targetsUpdate', {targetList, editingTarget});
        const actions = store.getActions();
        expect(actions[0].type).toEqual('scratch-gui/targets/UPDATE_TARGET_LIST');
        expect(actions[0].targets).toEqual(targetList);
        expect(actions[0].editingTarget).toEqual(editingTarget);
    });

    test('targetsUpdate does not dispatch if the sound recorder is visible', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        store = mockStore({
            scratchGui: {
                ...guiInitialState,
                mode: {},
                modals: {soundRecorder: true},
                vm: vm
            }
        });
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        const targetList = [];
        const editingTarget = 'id';
        vm.emit('targetsUpdate', {targetList, editingTarget});
        const actions = store.getActions();
        expect(actions.length).toEqual(0);
    });

    test('PROJECT_CHANGED does dispatch if the sound recorder is visible', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        store = mockStore({
            scratchGui: {
                ...guiInitialState,
                mode: {},
                modals: {soundRecorder: true},
                vm: vm
            }
        });
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PROJECT_CHANGED');
        const actions = store.getActions();
        expect(actions.length).toEqual(1);
    });

    test('PROJECT_CHANGED does not dispatch if in fullscreen mode', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        store = mockStore({
            scratchGui: {
                ...guiInitialState,
                mode: {isFullScreen: true},
                modals: {soundRecorder: true},
                vm: vm
            }
        });
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PROJECT_CHANGED');
        const actions = store.getActions();
        expect(actions.length).toEqual(0);
    });

    test('keypresses go to the vm', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);

        // Mock document.addEventListener so we can trigger keypresses manually
        // Cannot use the enzyme simulate method because that only works on synthetic events
        const eventTriggers = {};
        document.addEventListener = jest.fn((event, cb) => {
            eventTriggers[event] = cb;
        });

        vm.postIOData = jest.fn();

        store = mockStore({
            scratchGui: {
                ...guiInitialState,
                mode: {isFullScreen: true},
                modals: {soundRecorder: true},
                vm: vm
            }
        });
        mount(
            <WrappedComponent
                attachKeyboardEvents
                store={store}
                vm={vm}
            />
        );

        // keyboard events that do not target the document or body are ignored
        eventTriggers.keydown({key: 'A', target: null});
        expect(vm.postIOData).not.toHaveBeenLastCalledWith('keyboard', {key: 'A', isDown: true});

        // keydown/up with target as the document are sent to the vm via postIOData
        eventTriggers.keydown({key: 'A', target: document});
        expect(vm.postIOData).toHaveBeenLastCalledWith('keyboard', {key: 'A', isDown: true});

        eventTriggers.keyup({key: 'A', target: document});
        expect(vm.postIOData).toHaveBeenLastCalledWith('keyboard', {key: 'A', isDown: false});

        // When key is 'Dead' e.g. bluetooth keyboards on iOS, it sends keyCode instead
        // because the VM can process both named keys or keyCodes as the `key` property
        eventTriggers.keyup({key: 'Dead', keyCode: 10, target: document});
        expect(vm.postIOData).toHaveBeenLastCalledWith('keyboard', {key: 10, isDown: false});
    });

    test('a live channel rebuild flags the channel without an alert', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PERIPHERAL_LIVE_UNAVAILABLE', {deviceId: 'microPythonEsp32', reason: 'channel'});
        const actions = store.getActions();
        expect(actions).toEqual([{
            type: 'scratch-gui/connection-modal/setLiveUnavailable',
            liveUnavailable: true,
            reason: 'channel'
        }]);
    });

    test('a program that cannot be stopped raises the hint plus a one-shot alert, cleared on recovery', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PERIPHERAL_LIVE_UNAVAILABLE', {deviceId: 'microPythonEsp32', reason: 'interrupt-failed'});
        let actions = store.getActions();
        expect(actions[0]).toEqual({
            type: 'scratch-gui/connection-modal/setLiveUnavailable',
            liveUnavailable: true,
            reason: 'interrupt-failed'
        });
        expect(actions[1].type).toEqual('scratch-gui/alerts/SHOW_ALERT');
        expect(actions[1].alertId).toEqual('liveProgramNotStoppable');

        store.clearActions();
        vm.emit('PERIPHERAL_LIVE_AVAILABLE', {deviceId: 'microPythonEsp32'});
        actions = store.getActions();
        expect(actions[0]).toEqual({
            type: 'scratch-gui/connection-modal/setLiveUnavailable',
            liveUnavailable: false,
            reason: null
        });
        expect(actions[1].type).toEqual('scratch-gui/alerts/CLOSE_ALERT_WITH_ID');
        expect(actions[1].alertId).toEqual('liveProgramNotStoppable');
    });

    test('the not-stoppable alert is not re-raised while the same episode lasts', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        // The store already reflects the first report of this episode.
        store = mockStore({
            scratchGui: {
                ...guiInitialState,
                connectionModal: {
                    ...guiInitialState.connectionModal,
                    liveUnavailable: true,
                    liveUnavailableReason: 'interrupt-failed'
                },
                mode: {},
                modals: {},
                vm: vm
            }
        });
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PERIPHERAL_LIVE_UNAVAILABLE', {deviceId: 'microPythonEsp32', reason: 'interrupt-failed'});
        const actions = store.getActions();
        expect(actions.map(action => action.type)).toEqual(['scratch-gui/connection-modal/setLiveUnavailable']);
    });

    test('a settled connection clears the live hint and the alert', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        vm.emit('PERIPHERAL_DISCONNECTED');
        const types = store.getActions().map(action => action.type);
        expect(types).toContain('scratch-gui/connection-modal/setLiveUnavailable');
        const closed = store.getActions()
            .filter(action => action.type === 'scratch-gui/alerts/CLOSE_ALERT_WITH_ID')
            .map(action => action.alertId);
        expect(closed).toEqual(['peripheralReconnecting', 'liveProgramNotStoppable']);
    });

    describe('realtime board errors', () => {
        const OLED_TRACEBACK = 'Traceback (most recent call last):\r\n' +
            '  File "<stdin>", line 2, in <module>\r\n' +
            'RuntimeError: OLED is not initialized. Run the OLED init block first\r\n';
        const ENODEV_TRACEBACK = 'Traceback (most recent call last):\r\n' +
            '  File "<stdin>", line 1, in <module>\r\n' +
            'OSError: [Errno 19] ENODEV\r\n';
        const ALL_IDS = ['realtimeBoardError', 'realtimeBoardErrorNotReady', 'realtimeBoardErrorNotFound'];
        let now;

        beforeEach(() => {
            jest.useFakeTimers();
            now = jest.spyOn(Date, 'now').mockReturnValue(1000);
            const WrappedComponent = vmListenerHOC(() => (<div />));
            mount(
                <WrappedComponent
                    store={store}
                    vm={vm}
                />
            );
        });

        afterEach(() => {
            now.mockRestore();
            jest.useRealTimers();
        });

        const shown = () => store.getActions()
            .filter(action => action.type === 'scratch-gui/alerts/SHOW_ALERT');
        const closedIds = () => store.getActions()
            .filter(action => action.type === 'scratch-gui/alerts/CLOSE_ALERT_WITH_ID')
            .map(action => action.alertId);

        test('show one alert with the error line, closed once the error stops recurring', () => {
            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: OLED_TRACEBACK});
            expect(store.getActions()).toEqual([{
                type: 'scratch-gui/alerts/SHOW_ALERT',
                alertId: 'realtimeBoardErrorNotReady',
                data: {message: 'RuntimeError: OLED is not initialized. Run the OLED init block first'}
            }]);

            // The failing block keeps running in a loop: no second alert,
            // and the alert stays up while the error keeps coming.
            store.clearActions();
            now.mockReturnValue(9000);
            jest.runTimersToTime(8000);
            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: OLED_TRACEBACK});
            jest.runTimersToTime(14000);
            expect(store.getActions()).toEqual([]);

            jest.runTimersToTime(1000);
            expect(shown()).toEqual([]);
            expect(closedIds()).toEqual(ALL_IDS);
        });

        test('a different error replaces the alert at once, the same one returns after the display time', () => {
            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: OLED_TRACEBACK});
            now.mockReturnValue(2000);
            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: ENODEV_TRACEBACK});
            now.mockReturnValue(3000);
            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: ENODEV_TRACEBACK});
            expect(shown().map(action => action.alertId)).toEqual([
                'realtimeBoardErrorNotReady', 'realtimeBoardErrorNotFound'
            ]);
            expect(shown()[1].data.message).toEqual('OSError: [Errno 19] ENODEV');

            // Closed by hand while the loop keeps failing: back after the
            // display time, not on the very next occurrence.
            now.mockReturnValue(17000);
            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: ENODEV_TRACEBACK});
            expect(shown().length).toEqual(3);
        });

        test('a disconnect clears a shown board error, an empty message shows nothing', () => {
            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: '\r\n'});
            expect(store.getActions()).toEqual([]);

            vm.emit('PERIPHERAL_LIVE_ERROR', {deviceId: 'microPythonEsp32', message: OLED_TRACEBACK});
            store.clearActions();
            vm.emit('PERIPHERAL_DISCONNECTED');
            expect(closedIds()).toEqual(['peripheralReconnecting', 'liveProgramNotStoppable'].concat(ALL_IDS));

            store.clearActions();
            jest.runTimersToTime(20000);
            expect(store.getActions()).toEqual([]);
        });
    });

    test('realtime channel events for an unknown device are ignored instead of throwing', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmListenerHOC(Component);
        mount(
            <WrappedComponent
                store={store}
                vm={vm}
            />
        );
        // deviceData is empty in guiInitialState: the lookup yields undefined.
        expect(() => vm.emit('PERIPHERAL_REALTIME_CONNECTION_LOST_ERROR', {deviceId: 'gone', message: 'x'}))
            .not.toThrow();
        expect(() => vm.emit('PERIPHERAL_REALTIME_CONNECT_SUCCESS', {deviceId: 'gone'})).not.toThrow();
        expect(store.getActions()).toEqual([]);
    });
});
