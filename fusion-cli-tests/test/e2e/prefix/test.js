// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const request = require('axios');
const puppeteer = require('puppeteer');

const {start, cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

const dev = require('../setup.js');

test('`fusion dev` with route prefix and custom routes', async () => {
  const app = dev(dir, {
    env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
  });
  await app.setup();
  const url = app.url();
  const {data: rootRes} = await request(`${url}/test-prefix`);
  t.equal(
    rootRes,
    'ROOT REQUEST',
    'strips route prefix correctly for root requests'
  );
  const {data: testRes} = await request(`${url}/test-prefix/test`);
  t.equal(
    testRes,
    'TEST REQUEST',
    'strips route prefix correctly for deep path requests'
  );
  app.teardown();
}, 100000);

test('`fusion build/start with ROUTE_PREFIX and custom routes`', async () => {
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {
      ROUTE_PREFIX: '/test-prefix',
      NODE_ENV: 'production',
    }),
  });
  const {data: rootRes} = await request(`http://localhost:${port}/test-prefix`);
  t.equal(
    rootRes,
    'ROOT REQUEST',
    'strips route prefix correctly for root requests'
  );
  const {data: testRes} = await request(
    `http://localhost:${port}/test-prefix/test`
  );
  t.equal(
    testRes,
    'TEST REQUEST',
    'strips route prefix correctly for deep path requests'
  );

  const {data: tokenRes} = await request(
    `http://localhost:${port}/test-prefix/server-token`
  );
  t.equal(tokenRes, '/test-prefix', 'server-side RoutePrefixToken is set');

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/test-prefix/ssr`, {
    waitUntil: 'load',
  });

  const clientRoutePrefixTokenValue = await page.evaluate(() => {
    // eslint-disable-next-line
    return window.__client_route_prefix_token_value__;
  });
  t.equal(
    clientRoutePrefixTokenValue,
    '/test-prefix',
    'RoutePrefixToken hydrated on client'
  );
  proc.kill('SIGKILL');
  browser.close();
}, 100000);
