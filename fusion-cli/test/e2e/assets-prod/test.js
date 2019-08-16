// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const {promisify} = require('util');

const exists = promisify(fs.exists);

const dev = require('../setup.js');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` with assets', async () => {
  const env = {...process.env, NODE_ENV: 'production'};
  await cmd(`build --dir=${dir} --production`, {env});
  const jsPath = '/_static/client-main-2a2dcf4bf566f64f25b0.js';
  const mapPath = `${jsPath}.map`;
  try {
    const {proc, port} = await start(`--dir=${dir}`, {env});

    const asset = await request(`http://localhost:${port}${jsPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    t.equal(asset.statusCode, 200);

    const assetMap = await request(`http://localhost:${port}${mapPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    t.equal(assetMap.statusCode, 404);

    proc.kill();
  } catch (e) {
    t.ifError(e);
  }
}, 100000);
