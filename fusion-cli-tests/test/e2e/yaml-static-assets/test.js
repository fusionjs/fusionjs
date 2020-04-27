// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('`fusion dev` works with static YAML assets', async () => {
  try {
    const page = await app.browser().newPage();
    const url = await app.url();
    await page.goto(`${url}/`, {waitUntil: 'networkidle2'});

    const jsonDynamicContent = await page.evaluate(
      // $FlowFixMe
      () => document.querySelector('#content').textContent // eslint-disable-line
    );

    t.equal(
      jsonDynamicContent,
      'name 1|name 2',
      'imported YAML and YML works!'
    );
  } catch (e) {
    t.ifError(e);
  }
});
