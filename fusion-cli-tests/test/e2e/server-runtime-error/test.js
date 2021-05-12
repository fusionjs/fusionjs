// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const puppeteer = require('puppeteer');

const {dev} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` server runtime error', async () => {
  const {port, proc} = await dev(`--dir=${dir} --forceLegacyBuild`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});

  const content = await page.content();
  t.ok(content.includes('error-without-stack'));

  browser.close();
  proc.kill('SIGKILL');
}, 60000);
