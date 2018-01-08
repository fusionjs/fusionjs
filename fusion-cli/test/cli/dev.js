/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');
const {dev} = require('../run-command');
const {promisify} = require('util');

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

test('`fusion dev` works', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const {proc} = await dev(`--dir=${dir}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  t.ok(await exists(entry), 'Entry file gets compiled');
  proc.kill();
  t.end();
});

test('`fusion dev` works with assets', async t => {
  const dir = path.resolve(__dirname, '../fixtures/assets');
  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );
  const testFilePath = path.resolve(dir, '.fusion/test-asset');

  const {proc} = await dev(`--dir=${dir}`);
  t.ok(await exists(testFilePath), 'Generates test file');
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  const assetPath = await readFile(testFilePath);
  t.equal(
    assetPath.toString(),
    '/_static/d41d8cd98f00b204e9800998ecf8427e.js',
    'sets correct asset path'
  );
  proc.kill();
  t.end();
});

test('`fusion dev` works with assets with cdnUrl', async t => {
  const dir = path.resolve(__dirname, '../fixtures/assets');
  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );
  const testFilePath = path.resolve(dir, '.fusion/test-asset');
  const {proc} = await dev(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {CDN_URL: 'https://cdn.com'}),
  });
  t.ok(await exists(testFilePath), 'Generates test file');
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  const assetPath = await readFile(testFilePath);
  t.equal(
    assetPath.toString(),
    'https://cdn.com/d41d8cd98f00b204e9800998ecf8427e.js',
    'sets correct asset path'
  );
  proc.kill();
  t.end();
});

test('`fusion dev` top-level error', async t => {
  const dir = path.resolve(
    __dirname,
    '../fixtures/server-error-route-component'
  );
  const {res, proc} = await dev(`--dir=${dir}`);
  t.ok(res.includes('top-level-route-error'));
  proc.kill();
  t.end();
});
