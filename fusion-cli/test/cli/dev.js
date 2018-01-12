/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');
const {dev} = require('../run-command');
const {promisify} = require('util');
const request = require('request-promise');

const exists = promisify(fs.exists);

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
  const {proc, port} = await dev(`--dir=${dir}`);
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  const expectedAssetPath = '/_static/c300a7df05c8142598558365dbdaa451.css';
  try {
    const clientMain = await request(
      `http://localhost:${port}/_static/client-main.js`
    );
    t.ok(clientMain, 'serves client-main from memory correctly');
    t.ok(
      clientMain.includes('"src", "src/main.js")'),
      'transpiles __dirname and __filename'
    );
    t.ok(
      await request(`http://localhost:${port}/_static/client-vendor.js`),
      'serves client-vendor from memory correctly'
    );
    t.equal(
      await request(`http://localhost:${port}${expectedAssetPath}`),
      fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
      'serves css file from memory correctly'
    );
    t.equal(await request(`http://localhost:${port}/dirname`), 'src');
    t.equal(await request(`http://localhost:${port}/filename`), 'src/main.js');
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
  const {proc, port} = await dev(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {CDN_URL: 'https://cdn.com'}),
  });
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  t.equal(
    await request(`http://localhost:${port}/test`),
    'https://cdn.com/c300a7df05c8142598558365dbdaa451.css',
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
