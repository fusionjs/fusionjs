/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import AppFactory from '../client-app';

const App = AppFactory();

test('app callback', async t => {
  let numRenders = 0;
  const element = 'hi';
  const render = el => {
    numRenders++;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);
  const callback = app.callback();
  t.equal(typeof callback, 'function');
  // $FlowFixMe
  const ctx = await callback();
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test('throws rendering errors', async t => {
  const element = 'hi';
  const render = () => {
    return new Promise(() => {
      throw new Error('Test error');
    });
  };
  const app = new App(element, render);
  const callback = app.callback();

  try {
    await callback();
  } catch (e) {
    t.equal(e.message, 'Test error');
    t.end();
  }
});
