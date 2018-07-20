/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');
const {promisify} = require('util');
const request = require('request-promise');
const requestCb = require('request');
const puppeteer = require('puppeteer');

const {dev} = require('../run-command');

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
  let browser;
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
    t.equal(
      await request(`http://localhost:${port}/json`),
      '/_static/7526e1bdce8d3d115d6b4d6b79096e1c.json'
    );
    t.equal(
      await request(`http://localhost:${port}/json-import`),
      '{"key":"value"}'
    );
    t.equal(
      await request(`http://localhost:${port}/hoisted`),
      expectedAssetPath
    );

    // Spin up puppeteer to make runtime assertions on assetURLs
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
    const browserAssetUrl = await page.evaluate(() => {
      return typeof window !== undefined && window.__hoistedUrl__; //eslint-disable-line
    });
    t.equal(
      browserAssetUrl,
      expectedAssetPath,
      'hoisted assetURL works in the browser'
    );
  } catch (e) {
    t.iferror(e);
  }
  await (browser && browser.close());
  proc.kill();
  t.end();
});

test('`fusion dev` assets work with route prefix', async t => {
  const dir = path.resolve(__dirname, '../fixtures/assets');
  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );

  const {proc, port} = await dev(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
  });
  const expectedAssetPath = '/_static/c300a7df05c8142598558365dbdaa451.css';
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  t.equal(
    await request(`http://localhost:${port}/test-prefix/test`),
    '/test-prefix/_static/c300a7df05c8142598558365dbdaa451.css',
    'sets correct route prefix in path'
  );
  t.ok(
    await request(`http://localhost:${port}/test-prefix/_static/client-main.js`)
  );
  t.ok(
    await request(
      `http://localhost:${port}/test-prefix/_static/client-vendor.js`
    ),
    'serves client-vendor from memory correctly'
  );
  t.equal(
    await request(`http://localhost:${port}/test-prefix${expectedAssetPath}`),
    fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
    'serves css file from memory correctly'
  );
  proc.kill();
  t.end();
});

test('`fusion dev` with route prefix and custom routes', async t => {
  const dir = path.resolve(__dirname, '../fixtures/prefix');
  const {proc, port} = await dev(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
  });
  const rootRes = await request(`http://localhost:${port}/test-prefix`);
  t.equal(
    rootRes,
    'ROOT REQUEST',
    'strips route prefix correctly for root requests'
  );
  const testRes = await request(`http://localhost:${port}/test-prefix/test`);
  t.equal(
    testRes,
    'TEST REQUEST',
    'strips route prefix correctly for deep path requests'
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
  const {res, proc} = await dev(`--dir=${dir}`, {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  t.ok(
    res.includes('server-startup-error'),
    'should respond with server startup error'
  );
  proc.stderr.destroy();
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

test('`fusion dev` works with fs', async t => {
  const dir = path.resolve(__dirname, '../fixtures/tree-shaking');
  const {proc, port} = await dev(`--dir=${dir}`);
  const res = await request(`http://localhost:${port}/fs`);
  t.ok(res.includes('writeFile'), 'supports fs api on the server');
  const mainRes = await request(
    `http://localhost:${port}/_static/client-main.js`
  );
  t.ok(
    mainRes.includes('node-libs-browser/mock/empty.js'),
    'includes empty fs for browser in dev'
  );
  proc.kill();
  t.end();
});

test('`fusion dev` recovering from errors', async t => {
  const dir = path.resolve(__dirname, '../fixtures/server-startup-error');
  // $FlowFixMe
  const {res, proc} = await dev(`--dir=${dir}`, {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  const mainPath = path.join(dir, 'src/main.js');
  let numErrors = 0;
  t.ok(
    res.includes('server-startup-error'),
    'should respond with server startup error'
  );
  const output = [];
  function next() {
    numErrors++;
    if (numErrors === 2) {
      t.ok(
        output.join('').includes('server-startup-error'),
        'should log server startup error'
      );
      proc.stderr.destroy();
      proc.kill();
      t.end();
    } else {
      fs.writeFileSync(mainPath, fs.readFileSync(mainPath));
    }
  }
  proc.stderr.on('data', stderr => {
    output.push(stderr.toString());
    next();
  });
  // Need a wait here before saving otherwise the watcher won't pick up the edited file.
  await new Promise(resolve => setTimeout(resolve, 500));
  fs.writeFileSync(mainPath, fs.readFileSync(mainPath));
});

test('`fusion dev` with named async function', async t => {
  const dir = path.resolve(__dirname, '../fixtures/named-async-main');
  const {proc} = await dev(`--dir=${dir}`, {
    stdio: 'inherit',
  });
  proc.kill();
  t.end();
});

test('`fusion dev` CHUNK_ID instrumentation', async t => {
  const dir = path.resolve(__dirname, '../fixtures/split');
  const {proc, port} = await dev(`--dir=${dir}`, {
    stdio: 'inherit',
  });
  const resA = await request(`http://localhost:${port}/test-a`);
  const resB = await request(`http://localhost:${port}/test-b`);
  const res = await request(`http://localhost:${port}/test`);
  t.deepLooseEqual(JSON.parse(res), [2]);
  t.deepLooseEqual(JSON.parse(resA), [0, 2]);
  t.deepLooseEqual(JSON.parse(resB), [1, 2]);
  proc.kill();
  t.end();
});

test('`fusion dev` with server side redirects', async t => {
  const dir = path.resolve(__dirname, '../fixtures/redirect');
  const {proc, port} = await dev(`--dir=${dir}`, {
    stdio: 'inherit',
  });
  await new Promise(resolve => setTimeout(resolve, 5000));
  requestCb(
    {
      uri: `http://localhost:${port}/redirect`,
      followRedirect: false,
    },
    (err, res) => {
      t.equal(res.statusCode, 302, 'responds with a 302 status code');
      proc.kill();
      t.end();
    }
  );
});

test('`fusion dev` app with split translations integration', async t => {
  const dir = path.resolve(__dirname, '../fixtures/split-translations');

  const split2Path = path.join(dir, 'src/split2.js');
  const original = fs.readFileSync(split2Path, 'utf8');

  t.ok(original.includes('<Translate id="split2"/>'), 'has original src');
  const replaced = original.replace(
    '<Translate id="split2"/>',
    '<Translate id="hot"/>'
  );

  const {proc, port} = await dev(`--dir=${dir}`, {cwd: dir});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('<span>__MAIN_TRANSLATED__</span>'),
    'app content contains translated main chunk'
  );
  t.ok(
    !content.includes('__SPLIT1_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__SPLIT2_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__UNUSED_TRANSLATED__'),
    'unused translation not inlined'
  );

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);
  const content2 = await page.content();
  t.ok(
    content2.includes('__SPLIT1_TRANSLATED__'),
    'renders first  split translation'
  );

  const reloaded = page.evaluate(() => {
    return new Promise(resolve => {
      // eslint-disable-next-line
      window.__addHotStatusHandler(status => {
        if (status === 'idle') {
          resolve();
        }
      });
    });
  });

  fs.writeFileSync(split2Path, replaced);

  await reloaded;

  await Promise.all([
    page.click('#split2-link'),
    page.waitForSelector('#split2-translation'),
  ]);
  const content3 = await page.content();
  t.ok(
    content3.includes('__HOT_TRANSLATED__'),
    'renders second, hot split translation'
  );

  await browser.close();
  proc.kill();

  fs.writeFileSync(split2Path, original);

  t.end();
});

test('`fusion dev` app with split translations integration (cached)', async t => {
  const dir = path.resolve(__dirname, '../fixtures/split-translations');

  // Startup first time
  let {proc, port} = await dev(`--dir=${dir}`, {cwd: dir});
  proc.kill();

  // Restart
  ({proc, port} = await dev(`--dir=${dir}`, {cwd: dir}));
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('<span>__MAIN_TRANSLATED__</span>'),
    'app content contains translated main chunk'
  );

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);
  const content2 = await page.content();
  t.ok(
    content2.includes('__SPLIT1_TRANSLATED__'),
    'renders first  split translation'
  );

  await browser.close();
  proc.kill();

  t.end();
});
