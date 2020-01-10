// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('`fusion dev` works custom SSRBodyTemplateToken', async () => {
  try {
    const page = await app.browser().newPage();
    const url = await app.url();
    page.setJavaScriptEnabled(false);
    await page.goto(`${url}/`);
    const contents = await page.content();

    t.ok(
      contents.includes('<div>custom template</div>'),
      'custom SSRBodyTemplate used'
    );
  } catch (e) {
    t.ifError(e);
  }
});
