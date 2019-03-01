// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');

const puppeteer = require('puppeteer');
const {cmd, start} = require('../utils.js');

test('`fusion build` app with worker integration', async () => {
  const dir = path.resolve(__dirname + '/fixture');

  const env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  // Run puppeteer test to ensure that page loads with running worker
  const {proc, port} = await start(`--dir=${dir}`, {env});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});

  let content;
  let contentFound = false;
  while (!contentFound) {
    await new Promise(resolve => setTimeout(resolve, 100));
    content = await page.content();
    if (
      content.includes('worker1-included') &&
      content.includes('worker2-included')
    ) {
      contentFound = true;
    }
  }

  if (!content) {
    throw new Error('Could not find content');
  }

  t.ok(content.includes('worker1-included'), 'worker 1 included');
  t.ok(content.includes('worker2-included'), 'worker 2 included');

  await browser.close();
  proc.kill();
}, 100000);
