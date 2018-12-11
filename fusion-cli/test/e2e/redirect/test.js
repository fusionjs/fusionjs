// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const request = require('request-promise');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('`fusion dev` with server side redirects', async () => {
  const url = await app.url();
  try {
    await request({
      uri: `${url}/redirect`,
      followRedirect: false,
    });
  } catch (e) {
    t.equal(e.statusCode, 302, 'responds with a 302 status code');
  }
});
