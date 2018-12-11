// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('request-promise');

const dev = require('../setup.js');
const {start, cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` CHUNK_ID instrumentation', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();
  const resA = await request(`${url}/test-a`);
  const resB = await request(`${url}/test-b`);
  const res = await request(`${url}/test`);
  t.deepEqual(JSON.parse(res), [0]);
  t.deepEqual(JSON.parse(resA), [0, 1]);
  t.deepEqual(JSON.parse(resB), [0, 2]);
  app.teardown();
}, 100000);

test('`fusion build` with dynamic imports and group chunks', async () => {
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
  const resA = await request(`http://localhost:${port}/test-a`);
  const resB = await request(`http://localhost:${port}/test-b`);
  const res = await request(`http://localhost:${port}/test`);
  t.deepEqual(JSON.parse(res), [10003, 3]);
  t.deepEqual(JSON.parse(resA), [10003, 10004, 3, 4]);
  t.deepEqual(JSON.parse(resB), [10003, 10005, 3, 5]);
  proc.kill();
}, 100000);
