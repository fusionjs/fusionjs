/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {getSimulator} from 'fusion-test-utils';
import App, {SkipPrepareToken} from '../src/index';
import prepared from '../src/async/prepared';

test('custom render function', async () => {
  let didRender = false;
  const app = new App(React.createElement('span', null, 'hello'), (el, ctx) => {
    expect(el).toBeTruthy();
    expect(ctx).toBeTruthy();
    didRender = true;
    return 10;
  });
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  expect(ctx.element).toBeTruthy();
  expect(ctx.rendered).toBe(10);
  expect(didRender).toBeTruthy();
});

test('runs prepare', async done => {
  let called = false;
  const Root = prepared(() => {
    called = true;
    return Promise.resolve();
  })(() => {
    return React.createElement('span', null, 'hello');
  });
  const app = new App(React.createElement(Root), () => {
    expect(called).toBe(true);
    done();
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
});

test('skip prepare', async done => {
  const Root = prepared(() => {
    // $FlowFixMe
    done.fail('Should not call this');
    return Promise.resolve();
  })(() => {
    return React.createElement('span', null, 'hello');
  });
  const app = new App(React.createElement(Root), () => {
    done();
  });
  app.register(SkipPrepareToken, true);
  const simulator = getSimulator(app);
  await simulator.render('/');
});
