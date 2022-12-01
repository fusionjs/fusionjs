/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 * @jest-environment node
 */

/* eslint-env node */
import { Runtime } from "../../utils";

jest.setTimeout(60000);

test("useRPCRedux handler resolves data from redux store", async () => {
  const runtime = new Runtime({ fixture: __dirname });
  await runtime.start();

  // rpc actions are dispatched as sideEffects
  await runtime.page.waitForSelector('[data-testid="user-data"]');
  // test return value from useRPCRedux handler
  const handlerData = await runtime.page.$eval(
    '[data-testid="user-data"]',
    (el) => el.textContent
  );
  expect(handlerData).toEqual("user");

  await runtime.page.waitForSelector('[data-testid="trip-data"]');
  // test return value for useSelector
  const selectorData = await runtime.page.$eval(
    '[data-testid="trip-data"]',
    (el) => el.textContent
  );
  expect(selectorData).toEqual("trip");

  await runtime.end();
}, 60000);
