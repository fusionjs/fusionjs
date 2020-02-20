// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const puppeteer = require('puppeteer');

const {dev} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` server render error', async () => {
  const {res, port, proc} = await dev(`--dir=${dir} --forceLegacyBuild`);
  t.ok(!res.includes('server-render-error')); // ssr error falls back to client render
  t.ok(!res.includes('id="fallback"')); // error boundary is not initially rendered

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  await page.waitForSelector('#fallback');

  const content = await page.content();
  t.ok(content.includes('id="fallback"')); // error boundary is rendered

  browser.close();
  proc.kill('SIGKILL');
}, 60000);
