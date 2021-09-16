// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const puppeteer = require('puppeteer');

const dev = require('../setup.js');
const {start, cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` with pure esm package import', async () => {
  const app = dev(dir);
  const {browser, url} = await app.setup();

  const page = await browser.newPage();
  await page.goto(`${url}/`, {waitUntil: 'load'});

  const content = await page.content();
  t.ok(content.includes('FIXTURE_PURE_ESM_PACKAGE_CONTENT'));

  app.teardown();
}, 15000);

test('`fusion build` with pure esm package import', async () => {
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});

  const content = await page.content();
  t.ok(content.includes('FIXTURE_PURE_ESM_PACKAGE_CONTENT'));

  browser.close();
  proc.kill('SIGKILL');
}, 25000);
