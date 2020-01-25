// @flow
/* eslint-env browser */
import React from 'react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import App from 'fusion-core';
import {getService} from 'fusion-test-utils';

import Plugin from '../browser.js';

Enzyme.configure({adapter: new Adapter()});

/* Test fixtures */
const appCreator = () => {
  const app = new App('test', el => el);
  return () => app;
};

test('browser provider', async () => {
  const reduxState = document.createElement('script');
  reduxState.setAttribute('type', 'application/json');
  reduxState.setAttribute('id', '__PLUGIN_VALUE__');
  reduxState.textContent = JSON.stringify({value: 'create-fusion-plugin'});
  document.body && document.body.appendChild(reduxState);
  const provider = getService(appCreator(), Plugin);
  const {value} = provider && provider.from();
  expect(value).toBe('create-fusion-plugin');
});

test('browser middleware', async () => {
  const element = React.createElement('div');
  const ctx: any = {element, template: {body: []}, memoized: new Map()};
  const service = getService(appCreator(), Plugin);
  try {
    await (Plugin.middleware &&
      // $FlowFixMe
      Plugin.middleware(null, service)((ctx: any), () => Promise.resolve()));
  } catch (e) {
    expect(e).toBeFalsy();
  }
});
