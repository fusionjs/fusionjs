// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');

const {cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build --development` includes polyfills in legacy bundle', async () => {
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
    !/core-js\/modules\/es.array.map/.test(clientMain),
    'modern client bundle does not include array map polyfill'
  );
  t.ok(
    /core-js\/modules\/es.array.map/.test(clientLegacyMain),
    'legacy client bundle does include array map polyfill'
  );
}, 100000);

test('`fusion build --development` provides necessary polyfills in both modern and legacy bundles', async () => {
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
    /core-js\/modules\/es.object.has-own/.test(clientMain),
    'modern client bundle includes Object.hasOwn() polyfill that is not supported by modern target list'
  );
  t.ok(
    /core-js\/modules\/es.object.has-own/.test(clientLegacyMain),
    'legacy client bundle includes Object.hasOwn() polyfill that is not supported by legacy browsers'
  );
}, 100000);
