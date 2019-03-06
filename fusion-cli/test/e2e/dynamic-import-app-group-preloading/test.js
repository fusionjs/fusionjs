// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const puppeteer = require('puppeteer');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` app chunk group loading', async () => {
  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/split-a`, {waitUntil: 'load'});

  // runtime + main + vendor + A chunk + shared chunk
  const EXPECTED_PRELOADED_CHUNK_COUNT = 5;

  t.equal(
    await page.$$eval('link[rel="preload"]', els => els.length),
    EXPECTED_PRELOADED_CHUNK_COUNT
  );

  t.equal(
    await page.$$eval(
      'script[src]:not([type="application/json"])',
      els => els.length
    ),
    EXPECTED_PRELOADED_CHUNK_COUNT
  );
  browser.close();
  proc.kill();
}, 100000);
