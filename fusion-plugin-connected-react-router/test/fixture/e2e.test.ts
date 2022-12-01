/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 * @jest-environment node
 */

const { Runtime } = require("../utils");

/* eslint-env node */
test("browser plugin integration test", async () => {
  const runtime = new Runtime({ fixture: __dirname });
  await runtime.start();

  await runtime.page.waitForSelector('[data-testid="path"]');

  let path = await runtime.page.$eval(
    '[data-testid="path"]',
    (el) => el.textContent
  );
  expect(path).toEqual("/");

  await runtime.page.click("#go-to-test");
  await runtime.page.waitForSelector('[data-testid="path"]');

  path = await runtime.page.$eval(
    '[data-testid="path"]',
    (el) => el.textContent
  );
  expect(path).toEqual("/test");

  await runtime.end();
}, 30000);
