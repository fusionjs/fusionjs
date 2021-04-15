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
  expect(resA).toStrictEqual(['src_test-a_js', 'src_test-combined_js']);
  expect(resB).toStrictEqual(['src_test-b_js', 'src_test-combined_js']);
  expect(resCombined).toStrictEqual(['src_test-combined_js']);
  expect(resTransitive).toStrictEqual(['src_test-transitive_js']);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`${url}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">src_test-transitive_js</div>'));

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
  expect(resA).toStrictEqual(['legacy-809', 'legacy-649', 838, 967]);
  expect(resB).toStrictEqual(['legacy-893', 'legacy-649', 439, 967]);
  expect(resCombined).toStrictEqual(['legacy-649', 967]);
  expect(resTransitive).toStrictEqual(['legacy-542', 638]);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">638</div>'));

  browser.close();
  proc.kill('SIGKILL');
}, 100000);
