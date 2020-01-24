// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` works with assets', async () => {
  const app = dev(dir);
  await app.setup();
  const url = await app.url();
  const locallyCachedAssetPath =
    '/_static/c300a7df05c8142598558365dbdaa451.css';
  const uncachedAssetPath = '/_static/lol.css';
  try {
    t.equal(
      await request(`${url}${locallyCachedAssetPath}`),
      fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
      'serves cached asset locally'
    );
    t.equal(
      await request(`${url}${uncachedAssetPath}`),
      'hi from fallback middleware',
      'serves uncached asset from fallback middleware'
    );
  } catch (e) {
    t.ifError(e);
  }
  await app.teardown();
}, 100000);
