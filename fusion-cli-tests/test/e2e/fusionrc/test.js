// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('`fusion dev` works with fusionRC', async () => {
  try {
    const page = await app.browser().newPage();
    const url = await app.url();
    await page.goto(`${url}/`, {
      waitUntil: 'load',
    });

    const browserBufferContents = await page.evaluate(
      // $FlowFixMe
      () => window.__browser_buffer_test__ // eslint-disable-line
    );

    t.equal(
      browserBufferContents,
      'buffer',
      'Buffer shim override in browser works'
    );
  } catch (e) {
    t.ifError(e);
  }
});
