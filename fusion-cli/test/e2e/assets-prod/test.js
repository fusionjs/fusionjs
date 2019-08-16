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

test('source map static assets are not served in production', async () => {
  const env = {...process.env, NODE_ENV: 'production'};
  await cmd(`build --dir=${dir} --production`, {env});

  try {
    const {proc, port} = await start(`--dir=${dir}`, {env});

    const bundles = fs
      .readdirSync(path.join(dir, '.fusion/dist/production/client'))
      .filter(file => path.extname(file) === '.js');
    t.ok(bundles.length > 0);

    for (const bundle of bundles) {
      const jsPath = `/_static/${bundle}`;
      const mapPath = `${jsPath}.map`;

      const asset = await request(`http://localhost:${port}${jsPath}`, {
        resolveWithFullResponse: true,
        simple: false,
      });
      t.equal(
        asset.statusCode,
        200,
        'Request for JS bundle yields OK response'
      );

      const assetMap = await request(`http://localhost:${port}${mapPath}`, {
        resolveWithFullResponse: true,
        simple: false,
      });
      t.equal(
        assetMap.statusCode,
        404,
        'Request for associated source map 404s'
      );
      t.equal(assetMap.body, 'Not Found');
    }

    proc.kill();
  } catch (e) {
    t.ifError(e);
  }
}, 100000);
