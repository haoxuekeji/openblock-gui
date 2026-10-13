import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import ScanningStepComponent from '../components/connection-modal/scanning-step.jsx';
import VM from 'openblock-vm';

// 每次页面加载,每个设备只全自动重连一次:手动断开后再进扫描时,记住的
// 设备仍免选择器列出,但需要用户点一下确认——否则想换板子的用户会被
// "打开弹窗即自动连回原板子"困住。
const autoConnectDone = {};

class ScanningStep extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handlePeripheralListUpdate',
            'handlePeripheralScanTimeout',
            'handleClickListAll',
            'handleRefresh'
        ]);
        this.state = {
            scanning: true,
            peripheralList: []
        };
    }

    componentDidMount () {
        this.scanForPeripheral(this.props.isListAll);
        this.props.vm.on(
            'PERIPHERAL_LIST_UPDATE', this.handlePeripheralListUpdate);
        this.props.vm.on(
            'PERIPHERAL_SCAN_TIMEOUT', this.handlePeripheralScanTimeout);
    }

    componentWillUnmount () {
        // @todo: stop the peripheral scan here
        this.props.vm.removeListener(
            'PERIPHERAL_LIST_UPDATE', this.handlePeripheralListUpdate);
        this.props.vm.removeListener(
            'PERIPHERAL_SCAN_TIMEOUT', this.handlePeripheralScanTimeout);
    }

    scanForPeripheral (listAll, options) {
        this.props.vm.scanForPeripheral(this.props.deviceId, listAll, options);
    }

    handlePeripheralScanTimeout () {
        this.setState({
            scanning: false,
            peripheralList: []
        });
    }

    handlePeripheralListUpdate (newList) {
        // TODO: sort peripherals by signal strength? so they don't jump around
        const peripheralArray = Object.keys(newList).map(id =>
            newList[id]
        );
        // 系统选择器里刚选中的设备/串口带 autoConnect 标记:用户已经点过一次,
        // 不再要求在列表里再点一下,直接连接。
        const picked = peripheralArray.find(peripheral => peripheral.autoConnect);
        if (picked) {
            autoConnectDone[this.props.deviceId] = true;
            this.props.onConnecting(picked.peripheralId, picked.name);
            return;
        }
        // 免选择器重连:vm 侧从已授权设备(Web Bluetooth getDevices / Web Serial
        // getPorts)里找回上次的板子时会带 rememberedDevice 标记,首次直接进入
        // 连接流程,无需用户再点一次。
        const remembered = peripheralArray.find(peripheral => peripheral.rememberedDevice);
        if (remembered && !autoConnectDone[this.props.deviceId]) {
            autoConnectDone[this.props.deviceId] = true;
            this.props.onConnecting(remembered.peripheralId, remembered.name);
            return;
        }
        this.setState({peripheralList: peripheralArray});
    }

    handleClickListAll () {
        this.props.onClickListAll(!this.props.isListAll);
        this.scanForPeripheral(!this.props.isListAll);
        this.setState({
            scanning: true,
            peripheralList: []
        });
    }

    handleRefresh () {
        // 手动刷新 = 用户想换设备:强制弹系统选择器,跳过免选择器的记住设备路径
        // (Web Bluetooth getDevices / Web Serial getPorts)。串口的 listAll
        // 维持"不按 vid/pid 过滤"的原语义。
        this.scanForPeripheral(this.props.isListAll, {forceChooser: true});
        this.setState({
            scanning: true,
            peripheralList: []
        });
    }

    render () {
        return (
            <ScanningStepComponent
                connectionSmallIconURL={this.props.connectionSmallIconURL}
                isSerialport={this.props.isSerialport}
                isListAll={this.props.isListAll}
                peripheralList={this.state.peripheralList}
                phase={this.state.phase}
                scanning={this.state.scanning}
                title={this.props.deviceId}
                onConnected={this.props.onConnected}
                onConnecting={this.props.onConnecting}
                onClickListAll={this.handleClickListAll}
                onRefresh={this.handleRefresh}
                canChangeTransport={this.props.canChangeTransport}
                onChangeTransport={this.props.onChangeTransport}
            />
        );
    }
}

ScanningStep.propTypes = {
    canChangeTransport: PropTypes.bool,
    onChangeTransport: PropTypes.func,
    connectionSmallIconURL: PropTypes.string,
    isSerialport: PropTypes.bool.isRequired,
    isListAll: PropTypes.bool.isRequired,
    deviceId: PropTypes.string.isRequired,
    onConnected: PropTypes.func.isRequired,
    onConnecting: PropTypes.func.isRequired,
    onClickListAll: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default ScanningStep;
