// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');
const request = require('axios');
const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` works with assets', async () => {
  const app = dev(dir);
  await app.setup();
  const url = await app.url();
  const locallyCachedAssetPath = '/_static/3815e5e3cfed0142.css';
  const uncachedAssetPath = '/_static/lol.css';
  try {
    t.equal(
      (await request(`${url}${locallyCachedAssetPath}`)).data,
      fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
      'serves cached asset locally'
    );
    t.equal(
      (await request(`${url}${uncachedAssetPath}`)).data,
      'hi from fallback middleware',
      'serves uncached asset from fallback middleware'
    );
  } catch (e) {
    t.ifError(e);
  }
  await app.teardown();
}, 100000);
