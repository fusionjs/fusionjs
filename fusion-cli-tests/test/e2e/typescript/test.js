// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const puppeteer = require('puppeteer');

const dev = require('../setup.js');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

describe('TypeScript app', () => {
  test('`fusion build` works', async () => {
    const env = {
      ...process.env,
      NODE_ENV: 'production',
    };

    await cmd(`build --dir=${dir} --production`, {env});

    const {proc, port} = await start(`--dir=${dir}`, {env, cwd: dir});
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
    const content = await page.content();
    t.ok(content.includes('TypeScript'));

    browser.close();
    proc.kill('SIGKILL');
  }, 25000);

  test('`fusion dev` works', async () => {
    const app = dev(dir);

    await app.setup();

    const url = await app.url();
    const page = await app.browser().newPage();

    await page.goto(`${url}/`, {waitUntil: 'load'});
    const content = await page.content();
    t.ok(content.includes('TypeScript'));

    await app.teardown();
  }, 15000);
});
