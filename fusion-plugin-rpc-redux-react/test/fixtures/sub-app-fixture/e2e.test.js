/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @jest-environment node
 */

const {Runtime} = require('../../utils.js');

/* eslint-env node */
test('browser plugin integration test withRPCRedux', async done => {
  const runtime = new Runtime({fixture: __dirname});
  await runtime.start();

  const parentTripId = await runtime.page.$eval(
    '[data-testid="parent-trip-id"]',
    el => el.textContent
  );
  expect(parentTripId).toEqual('123');

  // child component is not rendered until after parent component is mounted,
  // so `prepared` will only be called in the browser
  // need to wait for rpc call to resolve
  await runtime.page.waitForSelector('[data-testid="child-trip-id"]');

  const childTripId = await runtime.page.$eval(
    '[data-testid="child-trip-id"]',
    el => el.textContent
  );
  expect(childTripId).toEqual('456');

  await runtime.end();
  done();
}, 30000);
