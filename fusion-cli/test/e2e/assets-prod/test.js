// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');
const request = require('request-promise');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('source maps for JS static assets are not served in production', async () => {
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

    const assetPath = await request(`http://localhost:${port}/asset-url`, {
      headers: {
        Accept: 'text/html',
      },
    });
    const asset = await request(`http://localhost:${port}${assetPath}`, {
      resolveWithFullResponse: true,
      simple: false,
    });
    t.equal(asset.statusCode, 200, 'Request for sourcemap via assetUrl works');

    proc.kill();
  } catch (e) {
    t.ifError(e);
  }
}, 100000);
