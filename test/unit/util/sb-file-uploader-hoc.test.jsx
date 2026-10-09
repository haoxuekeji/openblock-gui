import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl, shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import VM from 'openblock-vm';

import SBFileUploaderHOC from '../../../src/lib/sb-file-uploader-hoc.jsx';

describe('SBFileUploaderHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    // Wrap this in a function so it gets test specific states and can be reused.
    const getContainer = function () {
        const Component = () => <div />;
        return SBFileUploaderHOC(Component);
    };

    const shallowMountWithContext = component => (
        shallowWithIntl(component, {context: {store}})
    );

    const unwrappedInstance = () => {
        const WrappedComponent = getContainer();
        // default starting state: looking at a project you created, not logged in
        const wrapper = shallowMountWithContext(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={jest.fn()}
                closeFileMenu={jest.fn()}
                requestProjectUpload={jest.fn()}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );
        return wrapper
            .dive() // unwrap intl
            .dive() // unwrap redux Connect(SBFileUploaderComponent)
            .instance(); // SBFileUploaderComponent
    };

    beforeEach(() => {
        vm = new VM();
        store = mockStore({
            scratchGui: {
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                },
                vm: {}
            },
            locales: {
                locale: 'en'
            }
        });
    });

    test('correctly sets title with .sb3 filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb3');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb2 filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb2');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb');
        expect(projectName).toBe('my project is great');
    });

    test('sets blank title with filename with no extension', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great');
        expect(projectName).toBe('');
    });

    test('a successful upload marks the project changed so a new project gets saved', () => {
        const WrappedComponent = getContainer();
        const mounted = mountWithIntl(
            <WrappedComponent
                canSave
                cancelFileUpload={jest.fn()}
                closeFileMenu={jest.fn()}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );
        // Use the real redux-mapped onLoadingFinished (not an override).
        const onLoadingFinished = mounted.find('SBFileUploaderComponent').prop('onLoadingFinished');
        const changedType = 'scratch-gui/project-changed/SET_PROJECT_CHANGED';

        store.clearActions();
        onLoadingFinished(LoadingState.LOADING_VM_FILE_UPLOAD, true);
        const changed = store.getActions().find(a => a.type === changedType);
        expect(changed).toBeDefined();
        expect(changed.changed).toBe(true);

        // A failed / cancelled load must not mark the project changed.
        store.clearActions();
        onLoadingFinished(LoadingState.LOADING_VM_FILE_UPLOAD, false);
        expect(store.getActions().some(a => a.type === changedType)).toBe(false);
    });

    test('if isLoadingUpload becomes true, without fileToUpload set, will call cancelFileUpload', () => {
        const mockedCancelFileUpload = jest.fn();
        const WrappedComponent = getContainer();
        const mounted = mountWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );
        mounted.setProps({
            isLoadingUpload: true
        });
        expect(mockedCancelFileUpload).toHaveBeenCalled();
    });
});
