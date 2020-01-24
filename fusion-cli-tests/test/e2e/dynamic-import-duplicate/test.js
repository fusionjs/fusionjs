// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const puppeteer = require('puppeteer');
const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('Production build with duplicate dynamic imports renders on the client', async () => {
  await cmd(`build --production --dir=${dir}`);
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
  await page.goto(`http://localhost:${port}`, {waitUntil: 'load'});
  const content = await page.content();

  // No error messages
  t.ok(!content.includes('error'));
  // No loading messages
  t.ok(!content.includes('loading'));
  // All components load
  t.ok(
    content.includes(
      '<span>ONE</span>' + '<span>ONE</span>' + '<span>TWO</span>'
    )
  );

  browser.close();
  proc.kill('SIGKILL');
}, 100000);
