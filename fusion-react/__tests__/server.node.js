/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {getSimulator} from 'fusion-test-utils';
import render from '../src/server';
import App from '../src/index';

test('renders', () => {
  const rendered = render(React.createElement('span', null, 'hello'));
  expect(/<span/.test(rendered)).toBeTruthy();
  expect(/hello/.test(rendered)).toBeTruthy();
});

test('app api', async done => {
  expect(typeof App).toBe('function');
  const app = new App(React.createElement('div', null, 'Hello World'));
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  expect(ctx.rendered.includes('Hello World')).toBeTruthy();
  expect(
    typeof ctx.body === 'string' && ctx.body.includes(ctx.rendered)
  ).toBeTruthy();
  done();
});

test('throw on non-element root', async () => {
  expect(() => {
    // $FlowFixMe
    new App(function() {
      return null;
    });
  }).toThrow();
});
