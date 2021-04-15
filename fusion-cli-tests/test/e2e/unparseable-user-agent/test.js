// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);

const puppeteer = require('puppeteer');
const getPort = require('get-port');
const httpProxy = require('http-proxy');

const {cmd, start} = require('../utils.js');
const persistScriptTags = require('../persist-script-tags');

const dir = path.resolve(__dirname, './fixture');

async function getDistFiles(dir) {
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  const clientMainFile = clientFiles.filter(f =>
    /client-main-(.*?).js$/.test(f)
  )[0];
  const clientVendorFile = clientFiles.filter(f =>
    /client-vendor-(.*?).js$/.test(f)
  )[0];
  const splitClientChunks = clientFiles.filter(f => /[0-9]+-(.*?).js$/.test(f));
  return {
    clientFiles,
    clientMainFile,
    clientVendorFile,
    splitClientChunks,
  };
}

test('`fusion build` app with dynamic imports chunk hashing', async () => {
  await cmd(`build --dir=${dir} --production`);

  const splitChunkId = 1;
  const distFiles = await getDistFiles(dir);
  const dynamicFileBundlePath = path.resolve(
    dir,
    '.fusion/dist/production/client',
    distFiles.splitClientChunks[splitChunkId]
  );

  // Ensure that we have a dynamic chunk with content
  const dynamicFileBundleContent = fs
    .readFileSync(dynamicFileBundlePath)
    .toString();
  t.ok(
    dynamicFileBundleContent.includes('loaded-dynamic-import'),
    'dynamic content exists in bundle'
  );

  // Update dynamic file content, and rebuild.
  const dynamicFileContent = fs
    .readFileSync(path.resolve(dir, 'src/dynamic.js'))
    .toString();
  const newContent = dynamicFileContent.replace(
    'loaded-dynamic-import',
    'loaded-dynamic-import-updated'
  );
  fs.writeFileSync(path.resolve(dir, 'src/dynamic.js'), newContent);
  await cmd(`build --dir=${dir} --production`);

  // Ensure that vendor and main chunks do not change.
  const rebuiltDistFiles = await getDistFiles(dir);
  t.equal(
    distFiles.clientVendorFile,
    rebuiltDistFiles.clientVendorFile,
    'vendor file hash should not change'
  );
  t.equal(
    distFiles.clientMainFile,
    rebuiltDistFiles.clientMainFile,
    'main file hash should not change'
  );
  t.notEqual(
    distFiles.splitClientChunks[splitChunkId],
    rebuiltDistFiles.splitClientChunks[splitChunkId],
    'split client file hash should change'
  );

  // Clean up changed files
  fs.writeFileSync(path.resolve(dir, 'src/dynamic.js'), dynamicFileContent);
}, 100000);

test('`fusion build` app with dynamic imports integration', async () => {
  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  const proxyPort = await getPort();

  // Run puppeteer test to ensure that page loads with dynamic content.
  const {proc, port} = await start(`--dir=${dir}`, {env});

  let proxy = httpProxy
    .createProxyServer({target: `http://localhost:${port}`})
    .listen(proxyPort);

  const cookies = [];

  proxy.on('proxyReq', (proxyReq, req, res, options) => {
    if (req.url.endsWith('.js')) {
      cookies.push(req.headers.cookie);
    }
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setCookie({
    name: 'foo',
    value: 'bar',
    url: `http://localhost:${proxyPort}/`,
  });

  await page.goto(`http://localhost:${proxyPort}/`, {waitUntil: 'load'});
  await page.evaluate(persistScriptTags);

  // eslint-disable-next-line
  t.ok(await page.evaluate(() => window.__MAIN_EXECUTED__));

  const content = await page.content();
  t.ok(
    content.includes('loaded-dynamic-import'),
    'app content contains loaded-dynamic-import'
  );
  const SYNC_CHUNK_COUNT = 3; // runtime + main + vendor
  const ROUTE_INDEPENDENT_ASYNC_CHUNK_COUNT = 1;

  const BASE_COUNT = SYNC_CHUNK_COUNT + ROUTE_INDEPENDENT_ASYNC_CHUNK_COUNT;

  t.equal(
    await page.$$eval('link[rel="preload"]', els => els.length),
    BASE_COUNT
  );
  t.ok(
    await page.$$eval('link[rel="preload"]', els =>
      // eslint-disable-next-line
      els.every(el => el.getAttribute('nonce') === window.__NONCE__)
    ),
    'all preload hints have correct nonce attribute'
  );

  t.equal(
    await page.$$eval(
      'script[src]:not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT
  );

  // Async can causes race conditions as scripts may be executed before DOM is fully parsed.
  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      els.every(el => el.async === false)
    ),
    'all scripts not be async'
  );

  await page.click('#split-route-link');
  t.equal(
    await page.$$eval(
      'script[src]:not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT + 1,
    'one extra script after loading new route'
  );

  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      els.every(el => el.crossOrigin === null)
    ),
    'non-module scripts do not have crossorigin attribute'
  );

  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      // eslint-disable-next-line
      els.every(el => el.getAttribute('nonce') === window.__NONCE__)
    ),
    'all scripts have nonce attribute'
  );

  t.equal(cookies.length, BASE_COUNT + 1);
  t.ok(
    cookies.every(cookie => cookie === 'foo=bar'),
    'cookies sent w/ every request to chunk'
  );

  await page.goto(`http://localhost:${port}/split-route`);

  t.equal(
    await page.$$eval('link[rel="preload"]', els => els.length),
    BASE_COUNT + 1
  );
  t.equal(
    await page.$$eval(
      'script[src]:not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT + 1
  );

  browser.close();
  proc.kill('SIGKILL');
  proxy.close();
}, 100000);

test('`fusion build` app with googlebot UA (not-parseable)', async () => {
  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  // Run puppeteer test to ensure that page loads with dynamic content.
  const {proc, port} = await start(`--dir=${dir}`, {env});

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36'
  );

  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  await page.evaluate(persistScriptTags);

  // eslint-disable-next-line
  t.ok(await page.evaluate(() => window.__MAIN_EXECUTED__));

  const content = await page.content();
  t.ok(
    content.includes('loaded-dynamic-import'),
    'app content contains loaded-dynamic-import'
  );
  const SYNC_CHUNK_COUNT = 3; // runtime + main + vendor
  const ROUTE_INDEPENDENT_ASYNC_CHUNK_COUNT = 1;

  const BASE_COUNT = SYNC_CHUNK_COUNT + ROUTE_INDEPENDENT_ASYNC_CHUNK_COUNT;

  t.equal(
    await page.$$eval(
      'script[src]:not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT
  );

  // Async can causes race conditions as scripts may be executed before DOM is fully parsed.
  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      els.every(el => el.async === false)
    ),
    'all scripts not be async'
  );

  await page.click('#split-route-link');
  t.equal(
    await page.$$eval(
      'script[src]:not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT + 1,
    'one extra script after loading new route'
  );

  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      els.every(el => el.crossOrigin === null)
    ),
    'non-module scripts do not have crossorigin attribute'
  );

  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      // eslint-disable-next-line
      els.every(el => el.getAttribute('nonce') === window.__NONCE__)
    ),
    'all scripts have nonce attribute'
  );
  browser.close();
  proc.kill('SIGKILL');
}, 100000);
