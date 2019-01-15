// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const dir = path.resolve(__dirname, './fixture');

const puppeteer = require('puppeteer');

const {cmd, start} = require('../utils.js');

test('preserves function names', async () => {
  await cmd(`build --dir=${dir} --production --preserveNames`, {
    env: {...process.env, NODE_ENV: 'production'},
  });

  const {proc, port} = await start(`--dir=${dir}`, {
    env: {...process.env, NODE_ENV: 'production'},
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});

  /* eslint-disable */
  const functionName = await page.evaluate(() => window.__my_fn_name__);
  const className = await page.evaluate(() => window.__my_class_name__);
  /* eslint-enable */

  proc.kill();
  browser.close();

  t.equal(functionName, 'myCoolFunction');
  t.equal(className, 'MyCoolClass');
}, 30000);
