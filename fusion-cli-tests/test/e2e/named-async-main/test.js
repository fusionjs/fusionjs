// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('`fusion dev` with named async function', async () => {
  const url = app.url();
  const page = await app.browser().newPage();
  await page.goto(`${url}`);
  const contents = await page.content();
  t.ok(contents.includes('element'));
});
