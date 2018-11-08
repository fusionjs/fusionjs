/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import * as React from 'react';
import {getSimulator} from 'fusion-test-utils';
import render from '../server';
import App from '../index';

test('renders', t => {
  const rendered = render(React.createElement('span', null, 'hello'));
  t.ok(/<span/.test(rendered), 'has right tag');
  t.ok(/hello/.test(rendered), 'has right text');
  t.end();
});

test('app api', async t => {
  t.equal(typeof App, 'function', 'exports a function');
  try {
    const app = new App(React.createElement('div', null, 'Hello World'));
    const simulator = getSimulator(app);
    const ctx = await simulator.render('/');
    t.ok(ctx.rendered.includes('Hello World'));
    t.ok(typeof ctx.body === 'string' && ctx.body.includes(ctx.rendered));
  } catch (e) {
    t.ifError(e);
  } finally {
    t.end();
  }
});

test('throw on non-element root', async t => {
  t.throws(() => {
    // $FlowFixMe
    new App(function() {
      return null;
    });
  }, 'Passing a component instead of an element throws');
  t.end();
});
