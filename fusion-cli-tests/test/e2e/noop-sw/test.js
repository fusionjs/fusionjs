// @flow
/* eslint-env node */

const path = require('path');

const request = require('axios');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('sw bundle works with serialized/deserialized arguments', async () => {
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'production',
    }),
  });

  const {data: result} = await request(`http://localhost:${port}/sw.js`);
  expect(eval(result)).toStrictEqual([{foo: 'bar'}, 'browser.es2017.es.js']); // 'arguments serialized/deserialized correctly'

  proc.kill('SIGKILL');
}, 100000);
