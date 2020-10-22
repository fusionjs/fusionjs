// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('allows a custom entry point to be configured', async () => {
  try {
    const page = await app.browser().newPage();
    const url = await app.url();
    await page.goto(`${url}/`, {
      waitUntil: 'load',
    });

    t.ok('it compiled successful');
  } catch (e) {
    t.ifError(e);
  }
});
