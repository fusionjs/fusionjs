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

test('`fusion build` with assets', async () => {
  await cmd(`build --dir=${dir}`);
  const expectedAssetPath = '/_static/c300a7df05c8142598558365dbdaa451.css';
  try {
    const {proc, port} = await start(`--dir=${dir}`);
    const res = await request(`http://localhost:${port}${expectedAssetPath}`, {
      resolveWithFullResponse: true,
    });
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(res.headers['cache-control'], 'public, max-age=31536000');
    t.equal(res.body, contents);
    t.equal(res.headers['x-test'], 'test');
    proc.kill();
  } catch (e) {
    t.ifError(e);
  }

  // with route prefix
  try {
    const {proc, port} = await start(`--dir=${dir}`, {
      env: Object.assign({}, process.env, {
        ROUTE_PREFIX: '/test-prefix',
        NODE_ENV: 'development',
      }),
    });
    const res = await request(
      `http://localhost:${port}/test-prefix${expectedAssetPath}`,
      {
        resolveWithFullResponse: true,
      }
    );
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(res.body, contents);
    t.equal(res.headers['x-test'], 'test');
    proc.kill();
  } catch (e) {
    t.ifError(e);
  }
}, 100000);

test('`fusion dev` works with assets', async () => {
  const app = dev(dir);
  await app.setup();
  const url = await app.url();
  const expectedAssetPath = '/_static/c300a7df05c8142598558365dbdaa451.css';
  try {
    const clientMain = await request(`${url}/_static/client-main.js`);
    t.ok(clientMain, 'serves client-main from memory correctly');
    t.ok(
      clientMain.includes('"src", "src/main.js")'),
      'transpiles __dirname and __filename'
    );
    t.ok(
      await request(`${url}/_static/client-vendor.js`),
      'serves client-vendor from memory correctly'
    );
    t.equal(
      await request(`${url}${expectedAssetPath}`),
      fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
      'serves css file from memory correctly'
    );
    t.equal(
      await request(`${url}/_static/b78cb0eaf8604dad0108350cb5149457.txt`),
      fs
        .readFileSync(path.resolve(dir, 'src/static/test-server-asset.txt'))
        .toString(),
      'serves server asset from memory correctly'
    );
    t.equal(await request(`${url}/dirname`), 'src');
    t.equal(await request(`${url}/filename`), 'src/main.js');
    t.equal(
      await request(`${url}/json`),
      '/_static/20355efabaae9ed4d51fbc5a68eb4ce3.json'
    );
    t.equal(await request(`${url}/json-import`), '{"key":"value"}');
    t.equal(await request(`${url}/hoisted`), expectedAssetPath);

    const page = await app.browser().newPage();
    await page.goto(`${url}/`, {waitUntil: 'load'});
    const browserAssetUrl = await page.evaluate(() => {
      return typeof window !== undefined && window.__hoistedUrl__; //eslint-disable-line
    });
    t.equal(
      browserAssetUrl,
      expectedAssetPath,
      'hoisted assetURL works in the browser'
    );
  } catch (e) {
    t.ifError(e);
  }
  await app.teardown();
}, 100000);

test('`fusion dev` assets work with route prefix', async () => {
  const app = dev(dir, {
    env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
  });
  await app.setup();
  const url = app.url();

  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );

  const expectedAssetPath = '/_static/c300a7df05c8142598558365dbdaa451.css';
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  t.equal(
    await request(`${url}/test-prefix/test`),
    '/test-prefix/_static/c300a7df05c8142598558365dbdaa451.css',
    'sets correct route prefix in path'
  );
  t.ok(await request(`${url}/test-prefix/_static/client-main.js`));
  t.ok(
    await request(`${url}/test-prefix/_static/client-vendor.js`),
    'serves client-vendor from memory correctly'
  );
  t.equal(
    await request(`${url}/test-prefix${expectedAssetPath}`),
    fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
    'serves css file from memory correctly'
  );

  await app.teardown();
}, 100000);

test('`fusion dev` works with assets with cdnUrl', async () => {
  const app = dev(dir, {
    env: Object.assign({}, process.env, {CDN_URL: 'https://cdn.com'}),
  });
  await app.setup();
  const url = app.url();

  const entryPath = path.resolve(
    dir,
    '.fusion/dist/development/server/server-main.js'
  );
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  t.equal(
    await request(`${url}/test`),
    'https://cdn.com/c300a7df05c8142598558365dbdaa451.css',
    'sets correct asset path'
  );
  await app.teardown();
}, 100000);
