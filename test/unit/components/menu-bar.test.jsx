import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers';
import MenuBar from '../../../src/components/menu-bar/menu-bar';
import {menuInitialState} from '../../../src/reducers/menus';
import {LoadingState} from '../../../src/reducers/project-state';
import {guiInitialState} from '../../../src/reducers/gui';

import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import VM from 'openblock-vm';


describe('MenuBar Component', () => {
    // 以真实 guiInitialState 打底，保证 mapStateToProps 读取的
    // programMode / toolbox / connectionModal 等 openblock 新增键存在
    const store = configureStore()({
        locales: {
            isRtl: false,
            locale: 'en-US'
        },
        scratchGui: {
            ...guiInitialState,
            menus: menuInitialState,
            projectState: {
                loadingState: LoadingState.NOT_LOADED
            },
            vm: new VM()
        }
    });

    const getComponent = function (props = {}) {
        return <Provider store={store}><MenuBar {...props} /></Provider>;
    };

    test('menu bar with no About handler has no About button', () => {
        const menuBar = mountWithIntl(getComponent());
        const button = menuBar.find('AboutButton');
        expect(button.exists()).toBe(false);
    });

    test('menu bar with an About handler has an About button', () => {
        const onClickAbout = jest.fn();
        const menuBar = mountWithIntl(getComponent({onClickAbout}));
        const button = menuBar.find('AboutButton');
        expect(button.exists()).toBe(true);
    });

    test('clicking on About button calls the handler', () => {
        const onClickAbout = jest.fn();
        const menuBar = mountWithIntl(getComponent({onClickAbout}));
        const button = menuBar.find('AboutButton');
        expect(onClickAbout).toHaveBeenCalledTimes(0);
        button.simulate('click');
        expect(onClickAbout).toHaveBeenCalledTimes(1);
    });
});
