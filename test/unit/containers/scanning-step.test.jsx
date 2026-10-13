import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import ScanningStep from '../../../src/containers/scanning-step.jsx';
import VM from 'openblock-vm';

// The scan path decides how many clicks a connection costs:
//  - a device/port the user just picked in the system chooser carries
//    `autoConnect` and connects right away, every time;
//  - a device found silently among the granted ones carries
//    `rememberedDevice` and auto connects once per page session (so a
//    user who wants a different board is not trapped);
//  - Refresh forces the system chooser on every transport.
describe('ScanningStep container', () => {
    const makeVm = () => {
        const vm = new VM();
        vm.scanForPeripheral = jest.fn();
        return vm;
    };

    const mount = (vm, deviceId, extra = {}) => mountWithIntl(
        <ScanningStep
            deviceId={deviceId}
            isListAll={false}
            isSerialport
            vm={vm}
            onClickListAll={jest.fn()}
            onConnected={jest.fn()}
            onConnecting={extra.onConnecting || jest.fn()}
            {...extra}
        />
    );

    test('mounting starts a scan without forcing the chooser', () => {
        const vm = makeVm();
        mount(vm, 'esp32-a');
        expect(vm.scanForPeripheral).toHaveBeenCalledWith('esp32-a', false, undefined);
    });

    test('a chooser pick (autoConnect) connects immediately, every time', () => {
        const vm = makeVm();
        const onConnecting = jest.fn();
        mount(vm, 'esp32-b', {onConnecting});
        vm.emit('PERIPHERAL_LIST_UPDATE', {'web-serial': {peripheralId: 'web-serial', name: 'USB', autoConnect: true}});
        vm.emit('PERIPHERAL_LIST_UPDATE', {'web-serial': {peripheralId: 'web-serial', name: 'USB', autoConnect: true}});
        expect(onConnecting).toHaveBeenCalledTimes(2);
        expect(onConnecting).toHaveBeenCalledWith('web-serial', 'USB');
    });

    test('a remembered device auto connects once per page, then is listed for a click', () => {
        const vm = makeVm();
        const onConnecting = jest.fn();
        const wrapper = mount(vm, 'esp32-c', {onConnecting});
        const remembered = {'dev-1': {peripheralId: 'dev-1', name: 'OB32-1', rememberedDevice: true}};
        vm.emit('PERIPHERAL_LIST_UPDATE', remembered);
        expect(onConnecting).toHaveBeenCalledTimes(1);
        vm.emit('PERIPHERAL_LIST_UPDATE', remembered);
        expect(onConnecting).toHaveBeenCalledTimes(1);
        wrapper.update();
        expect(wrapper.find('ScanningStep').first().state('peripheralList')).toHaveLength(1);
    });

    test('Refresh rescans with forceChooser so the user can pick another device', () => {
        const vm = makeVm();
        const wrapper = mount(vm, 'esp32-d');
        wrapper.find('ScanningStep').first().instance().handleRefresh();
        expect(vm.scanForPeripheral).toHaveBeenLastCalledWith('esp32-d', false, {forceChooser: true});
    });
});
