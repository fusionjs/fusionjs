// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const puppeteer = require('puppeteer');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(20000);

test('universal values works', async () => {
  await cmd(`build --dir=${dir}`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: {
      ...process.env,
      SOME_ENV_VAR1: 'foo',
      SOME_ENV_VAR2: 'bar',
    },
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('error', (err) => {
    // $FlowFixMe
    t.fail(`Client-side error: ${err}`);
  });

  page.on('pageerror', (err) => {
    // $FlowFixMe
    t.fail(`Client-side error: ${err}`);
  });

  await page.goto(`http://localhost:${port}/`);

  const [result1, result2, result3] = await Promise.all([
    page.waitForSelector('#result1'),
    page.waitForSelector('#result2'),
    page.waitForSelector('#result3'),
  ]);

  t.equal(await page.evaluate((el) => el.textContent, result1), 'foo');
  t.equal(await page.evaluate((el) => el.textContent, result2), 'bar');
  t.equal(await page.evaluate((el) => el.textContent, result3), 'baz');

  browser.close();
  proc.kill('SIGKILL');
}, 100000);
