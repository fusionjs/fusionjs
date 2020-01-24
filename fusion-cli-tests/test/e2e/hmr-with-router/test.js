// @flow
/* eslint-env node */

const path = require('path');
const testHmr = require('../hmr.js');

const dir = path.resolve(__dirname, './fixture');

test('test hmr with router', async () => {
  await testHmr(dir);
}, 100000);
