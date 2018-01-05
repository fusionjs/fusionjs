/* eslint-env node */

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const test = require('tape');
const getPort = require('get-port');

const {run} = require('../../bin/cli-runner');
const runnerPath = require.resolve('../../bin/cli-runner');

test('`fusion dev` works', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);

  const {stop} = await run(
    `dev --dir=${dir} --no-open --port=${await getPort()}`
  );
  stop();
  t.ok(fs.existsSync(entry), 'Entry file gets compiled');
  t.end();
});

test('`fusion dev` works with assets', async t => {
  const dir = path.resolve(__dirname, '../fixtures/assets');
  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );
  const testFilePath = path.resolve(dir, '.fusion/test-asset');

  const {stop} = await run(
    `dev --dir=${dir} --no-open --port=${await getPort()}`
  );
  t.ok(fs.existsSync(testFilePath), 'Generates test file');
  t.ok(fs.existsSync(entryPath), 'Entry file gets compiled');
  const assetPath = fs.readFileSync(testFilePath);
  t.equal(
    assetPath.toString(),
    '/_static/d41d8cd98f00b204e9800998ecf8427e.js',
    'sets correct asset path'
  );
  stop();
  t.end();
});

test('`fusion dev` works with assets with cdnUrl', async t => {
  const dir = path.resolve(__dirname, '../fixtures/assets');
  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );
  const testFilePath = path.resolve(dir, '.fusion/test-asset');
  process.env.CDN_URL = 'https://cdn.com';
  const {stop} = await run(
    `dev --dir=${dir} --no-open --port=${await getPort()}`
  );
  t.ok(fs.existsSync(testFilePath), 'Generates test file');
  t.ok(fs.existsSync(entryPath), 'Entry file gets compiled');
  const assetPath = fs.readFileSync(testFilePath);
  t.equal(
    assetPath.toString(),
    'https://cdn.com/d41d8cd98f00b204e9800998ecf8427e.js',
    'sets correct asset path'
  );
  stop();
  process.env.CDN_URL = '';
  t.end();
});

test('`fusion dev` top-level error', async t => {
  const dir = path.resolve(
    __dirname,
    '../fixtures/server-error-route-component'
  );
  const port = await getPort();
  const command = `require('${runnerPath}').run('dev --dir=${dir} --no-open --port=${port}')`;
  const childServer = child_process.spawn('node', ['-e', command]);

  function checkContentForError() {
    try {
      const cmd = `curl -s -H 'Accept: text/html' http://localhost:${port}`;
      const result = child_process.execSync(cmd);
      return String(result).includes('top-level-route-error');
    } catch (e) {
      return false;
    }
  }

  function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  let hasError = false;
  while (!hasError) {
    await pause(200);
    hasError = checkContentForError();
  }

  childServer.kill();
  t.end();
});
