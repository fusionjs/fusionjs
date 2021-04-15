// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');
const request = require('axios');
const {promisify} = require('util');

const exists = promisify(fs.exists);

const dev = require('../setup.js');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` with assets', async () => {
  await cmd(`build --dir=${dir}`);
  const expectedAssetPath = '/_static/20ae62de101a89a2c832407dc0ee0bbf.css';
  try {
    const {proc, port} = await start(`--dir=${dir}`);
    const res = await request(`http://localhost:${port}${expectedAssetPath}`);
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(
      res.headers['cache-control'],
      'max-age=0',
      'should not cache build assets for non-production builds'
    );
    t.equal(res.headers['x-route-name'], 'static_asset');
    t.equal(res.data, contents);
    t.equal(res.headers['x-test'], 'test');
    proc.kill('SIGKILL');
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
      `http://localhost:${port}/test-prefix${expectedAssetPath}`
    );
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(res.data, contents);
    t.equal(res.headers['x-test'], 'test');
    t.equal(res.headers['x-route-name'], 'static_asset');
    proc.kill('SIGKILL');
  } catch (e) {
    t.ifError(e);
  }
}, 100000);

test('`fusion build --production` with assets', async () => {
  const env = {...process.env, NODE_ENV: 'production'};
  await cmd(`build --production --dir=${dir}`, {env});
  const expectedAssetPath = '/_static/20ae62de101a89a2c832407dc0ee0bbf.css';
  try {
    const {proc, port} = await start(`--dir=${dir}`, {env});
    const res = await request(`http://localhost:${port}${expectedAssetPath}`);
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(
      res.headers['cache-control'],
      'public, max-age=31536000',
      'should cache build assets for production builds'
    );
    t.equal(res.headers['x-route-name'], 'static_asset');
    t.equal(res.data, contents);
    t.equal(res.headers['x-test'], 'test');
    proc.kill('SIGKILL');
  } catch (e) {
    t.ifError(e);
  }

  // with route prefix
  try {
    const {proc, port} = await start(`--dir=${dir}`, {
      env: Object.assign({}, env, {
        ROUTE_PREFIX: '/test-prefix',
      }),
    });
    const res = await request(
      `http://localhost:${port}/test-prefix${expectedAssetPath}`
    );
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(res.data, contents);
    t.equal(res.headers['x-test'], 'test');
    t.equal(res.headers['x-route-name'], 'static_asset');
    proc.kill('SIGKILL');
  } catch (e) {
    t.ifError(e);
  }
}, 100000);

test('`fusion dev` works with assets', async () => {
  const app = dev(dir);
  await app.setup();
  const url = await app.url();
  const expectedAssetPath = '/_static/20ae62de101a89a2c832407dc0ee0bbf.css';
  try {
    const {data: clientMain} = await request(`${url}/_static/client-main.js`);
    t.ok(clientMain, 'serves client-main from memory correctly');
    t.ok(
      (await request(`${url}/_static/client-vendor.js`)).data,
      'serves client-vendor from memory correctly'
    );
    t.equal(
      (await request(`${url}${expectedAssetPath}`)).data,
      fs.readFileSync(path.resolve(dir, 'src/static/test.css')).toString(),
      'serves css file from memory correctly'
    );
    t.equal(
      (await request(`${url}/_static/513b30e20d8764530352254b5d7693b1.txt`))
        .data,
      fs
        .readFileSync(path.resolve(dir, 'src/static/test-server-asset.txt'))
        .toString(),
      'serves server asset from memory correctly'
    );
    t.equal((await request(`${url}/dirname`)).data, 'src');
    t.equal((await request(`${url}/filename`)).data, 'src/main.js');

    const jsonAssetRes = await request(`${url}/json`);
    t.equal(jsonAssetRes.headers['x-route-name'], 'unknown_route');
    const jsonAsset = await request(url + jsonAssetRes.data);
    t.equal(
      jsonAssetRes.data,
      '/_static/5c2541248f36989929204695d12a0cad.json'
    );
    expect(jsonAsset.data).toStrictEqual({key: 'value', unused_key: ''}); // 'assetUrl saves original json file'

    t.equal(
      (await request(`${url}/json-import`)).data,
      'value',
      'importing a single json key works'
    );
    t.ok(
      clientMain.indexOf('unused_key') === -1,
      'json tree shaking removes unused keys'
    );
    t.equal((await request(`${url}/hoisted`)).data, expectedAssetPath);

    const page = await app.browser().newPage();
    await page.goto(`${url}/`, {waitUntil: 'load'});
    const browserAssetUrl = await page.evaluate(() => {
      return typeof window !== undefined && window.__hoistedUrl__; //eslint-disable-line
    });
    const browserDirname = await page.evaluate(() => {
      return typeof window !== undefined && window.__hoistedDirname__; //eslint-disable-line
    });
    const browserFilename = await page.evaluate(() => {
      return typeof window !== undefined && window.__hoistedFilename__; //eslint-disable-line
    });
    t.equal(
      browserAssetUrl,
      expectedAssetPath,
      'hoisted assetURL works in the browser'
    );
    t.equal(browserDirname, 'src', '__dirname works in the browser');
    t.equal(browserFilename, 'src/main.js', '__filename works in the browser');
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

  const expectedAssetPath = '/_static/20ae62de101a89a2c832407dc0ee0bbf.css';
  t.ok(await exists(entryPath), 'Entry file gets compiled');
  t.equal(
    (await request(`${url}/test-prefix/test`)).data,
    '/test-prefix/_static/20ae62de101a89a2c832407dc0ee0bbf.css',
    'sets correct route prefix in path'
  );
  t.ok((await request(`${url}/test-prefix/_static/client-main.js`)).data);
  t.ok(
    (await request(`${url}/test-prefix/_static/client-vendor.js`)).data,
    'serves client-vendor from memory correctly'
  );
  t.equal(
    (await request(`${url}/test-prefix${expectedAssetPath}`)).data,
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
    (await request(`${url}/test`)).data,
    'https://cdn.com/20ae62de101a89a2c832407dc0ee0bbf.css',
    'sets correct asset path'
  );
  await app.teardown();
}, 100000);
