// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);

const dir = path.resolve(__dirname, './fixture');

const {cmd} = require('../utils.js');

test('`fusion build` tree shaking unused imports in dev w/ assumeNoImportSideEffects: true', async () => {
  await cmd(`build --dir=${dir}`);

  const distFolder = path.resolve(dir, '.fusion/dist/development/client');
  const clientFiles = await readdir(distFolder);

  clientFiles
    .filter(file => path.extname(file) === '.js')
    .map(file => path.join(distFolder, file))
    .forEach(file => {
      t.ok(
        !fs.readFileSync(file, 'utf-8').includes('__fixture_pkg_unused__'),
        'should not include unused export in browser'
      );
    });
}, 100000);

test('`fusion build` polyfills with assumeNoImportSideEffects: true', async () => {
  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  const distFolder = path.resolve(dir, '.fusion/dist/production/client');
  const clientFiles = await readdir(distFolder);

  const hasCoreJS = clientFiles
    .filter(file => path.extname(file) === '.js')
    .map(file => path.join(distFolder, file))
    .some(file => {
      return fs.readFileSync(file, 'utf-8').includes('__core-js_shared__');
    });

  t.ok(hasCoreJS, 'some client bundle JS includes core-js');
}, 100000);
