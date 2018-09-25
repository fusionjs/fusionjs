/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App from '../index';

test('interface', t => {
  const element = () => 'hi';
  const render = () => {};

  const app = new App(element, render);
  t.ok(app.plugins instanceof Array, 'sets plugins');
  t.equal(typeof app.register, 'function', 'has a register function');
  t.equal(typeof app.getService, 'function', 'has a getService function');
  t.ok(typeof app.callback === 'function', 'callback is function');
  t.ok(typeof app.callback() === 'function', 'callback returns server handler');
  t.end();
});
