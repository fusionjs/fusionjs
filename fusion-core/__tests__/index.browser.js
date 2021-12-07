/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import AppFactory from '../src/client-app';

const App = AppFactory();

test('app callback', async () => {
  let numRenders = 0;
  const element = 'hi';
  const render = (el) => {
    numRenders++;
    expect(el).toBe(element);
    return el;
  };
  const app = new App(element, render);
  const callback = app.callback();
  expect(typeof callback).toBe('function');
  const ctx = await callback();
  expect(ctx.rendered).toBe(element);
  expect(numRenders).toBe(1);
  expect(ctx.element).toBe(element);
});

test('throws rendering errors', async (done) => {
  const element = 'hi';
  const render = () => {
    return new Promise(() => {
      throw new Error('Test error');
    });
  };
  const app = new App(element, render);
  const callback = app.callback();

  await expect(callback()).rejects.toThrow('Test error');
  done();
});
