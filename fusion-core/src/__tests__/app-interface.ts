/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import App from '../index';

test('interface', () => {
  const element = () => 'hi';
  const render = () => {};

  const app = new App(element, render);
  expect(app.plugins instanceof Array).toBeTruthy();
  expect(typeof app.register).toBe('function');
  expect(typeof app.getService).toBe('function');
  expect(typeof app.callback === 'function').toBeTruthy();
  expect(typeof app.callback() === 'function').toBeTruthy();
});
