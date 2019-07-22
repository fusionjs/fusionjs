// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('request-promise');
const puppeteer = require('puppeteer');

const dev = require('../setup.js');
const {start, cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` CHUNK_ID instrumentation', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();
  const resA = await request(`${url}/test-a`);
  const resB = await request(`${url}/test-b`);
  const resCombined = await request(`${url}/test-combined`);
  const resTransitive = await request(`${url}/test-transitive`);
  t.deepEqual(JSON.parse(resA), [0, 2]);
  t.deepEqual(JSON.parse(resB), [0, 3]);
  t.deepEqual(JSON.parse(resCombined), [0]);
  t.deepEqual(JSON.parse(resTransitive), [1]);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`${url}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">1</div>'));

  app.teardown();
}, 100000);

test('`fusion build` with dynamic imports and group chunks', async () => {
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
  const resA = await request(`http://localhost:${port}/test-a`);
  const resB = await request(`http://localhost:${port}/test-b`);
  const resCombined = await request(`http://localhost:${port}/test-combined`);
  const resTransitive = await request(
    `http://localhost:${port}/test-transitive`
  );
  t.deepEqual(JSON.parse(resA), [10003, 10004, 3, 4]);
  t.deepEqual(JSON.parse(resB), [10003, 10005, 3, 5]);
  t.deepEqual(JSON.parse(resCombined), [10003, 3]);
  t.deepEqual(JSON.parse(resTransitive), [10006, 6]);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">6</div>'));

  proc.kill();
}, 100000);
