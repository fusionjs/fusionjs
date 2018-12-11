// @flow
/* eslint-env node */

const path = require('path');
const testHmr = require('../hmr.js');

const dir = path.resolve(__dirname, './fixture');

test('test hmr simple app', async () => {
  await testHmr(dir);
}, 100000);
