// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('axios');
const puppeteer = require('puppeteer');

const dev = require('../setup.js');
const {start, cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` CHUNK_ID instrumentation', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();
  const {data: resA} = await request(`${url}/test-a`);
  const {data: resB} = await request(`${url}/test-b`);
  const {data: resCombined} = await request(`${url}/test-combined`);
  const {data: resTransitive} = await request(`${url}/test-transitive`);
  expect(resA).toStrictEqual([0, 2]);
  expect(resB).toStrictEqual([0, 3]);
  expect(resCombined).toStrictEqual([0]);
  expect(resTransitive).toStrictEqual([1]);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`${url}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">1</div>'));

  browser.close();
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
  const {data: resA} = await request(`http://localhost:${port}/test-a`);
  const {data: resB} = await request(`http://localhost:${port}/test-b`);
  const {data: resCombined} = await request(
    `http://localhost:${port}/test-combined`
  );
  const {data: resTransitive} = await request(
    `http://localhost:${port}/test-transitive`
  );
  expect(resA).toStrictEqual([10003, 10004, 3, 4]);
  expect(resB).toStrictEqual([10003, 10005, 3, 5]);
  expect(resCombined).toStrictEqual([10003, 3]);
  expect(resTransitive).toStrictEqual([10006, 6]);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">6</div>'));

  browser.close();
  proc.kill('SIGKILL');
}, 100000);
