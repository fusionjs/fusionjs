// @flow
/* eslint-env browser */
import tape from 'tape-cup';
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

tape('browser middleware', async t => {
  const element = React.createElement('div');
  const ctx: any = {element, template: {body: []}, memoized: new Map()};
  const service = getService(appCreator(), Plugin);
  try {
    await (Plugin.middleware &&
      // $FlowFixMe
      Plugin.middleware(null, service)((ctx: any), () => Promise.resolve()));
  } catch (e) {
    t.ifError(e);
  }

  t.end();
});
