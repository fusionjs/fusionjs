/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');
const {dev} = require('../run-command');
const {promisify} = require('util');
const request = require('request-promise');

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

test.only('`fusion dev` works with assets', async t => {
  const dir = path.resolve(__dirname, '../fixtures/assets');
  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );
  const testFilePath = path.resolve(dir, '.fusion/test-asset');

  const {proc, port} = await dev(`--dir=${dir}`);
  t.ok(await exists(testFilePath), 'Generates test file');
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  const assetPath = await readFile(testFilePath);
  const expectedAssetPath = '/_static/c300a7df05c8142598558365dbdaa451.css';
  t.equal(assetPath.toString(), expectedAssetPath, 'sets correct asset path');
  try {
    t.ok(
      await request(`http://localhost:${port}/_static/client-main.js`),
      'serves client-main from memory correctly'
    );
    t.ok(
      await request(`http://localhost:${port}/_static/client-vendor.js`),
      'serves client-vendor from memory correctly'
    );
    t.equal(
      fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
      await request(`http://localhost:${port}${expectedAssetPath}`),
      'serves css file from memory correctly'
    );
  } catch (e) {
    t.iferror(e);
  }
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
  const dir = path.resolve(__dirname, '../fixtures/server-startup-error');
  const {res, proc} = await dev(`--dir=${dir}`);
  t.ok(res.includes('server-startup-error'));
  proc.kill();
  t.end();
});

test('`fusion dev` server render error', async t => {
  const dir = path.resolve(__dirname, '../fixtures/server-render-error');
  const {res, proc} = await dev(`--dir=${dir}`);
  t.ok(res.includes('server-render-error'));
  proc.kill();
  t.end();
});
