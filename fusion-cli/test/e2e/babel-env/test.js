// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build --development` only includes polyfills in legacy bundle', async () => {
  const env = 'development';
  await cmd(`build --dir=${dir} --${env}`);

  const buildDir = path.resolve(dir, `.fusion/dist/${env}/client`);
  const clientMain = fs.readFileSync(
    path.join(buildDir, 'client-main.js'),
    'utf-8'
  );
  const clientLegacyMain = fs.readFileSync(
    path.join(buildDir, 'client-legacy-main.js'),
    'utf-8'
  );

  t.ok(
    !/core-js\/modules\/es.array.includes/.test(clientMain),
    'modern client bundle does not include array includes polyfill'
  );
  t.ok(
    /core-js\/modules\/es.array.includes/.test(clientLegacyMain),
    'legacy client bundle does include array includes polyfill'
  );
}, 100000);
