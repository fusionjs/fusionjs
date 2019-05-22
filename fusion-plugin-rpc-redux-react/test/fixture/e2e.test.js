/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

const {Runtime} = require('../utils.js');

/* eslint-env node */
test('browser plugin integration test withRPCRedux', async done => {
  const runtime = new Runtime({fixture: __dirname});
  await runtime.start();

  // rpc actions are dispatched as sideEffect
  // result of successful rpc call is returned in dom
  const userId = await runtime.page.$eval(
    '[data-testid="user-id"]',
    el => el.textContent
  );
  expect(userId).toEqual('123');

  await runtime.end();
  done();
}, 30000);
