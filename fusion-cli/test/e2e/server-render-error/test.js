// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const {dev} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` server render error', async () => {
  const {res, proc} = await dev(`--dir=${dir}`);
  t.ok(res.includes('server-render-error'));
  proc.kill();
}, 60000);
