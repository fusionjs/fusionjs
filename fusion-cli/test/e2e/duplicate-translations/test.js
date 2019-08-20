// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const request = require('request-promise');

const dev = require('../setup.js');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('promise instrumentation deduplicates translations', async () => {
  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir}`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env, cwd: dir});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();

  t.ok(
    content.includes('<div data-testid="main">["main"]</div>'),
    'translation keys within the same component are de-duped'
  );
  t.ok(
    content.includes('<div data-testid="with-children">["with-child-translation"]</div>'),
    'translation keys within the same chunk are de-duped'
  );
  browser.close();
  proc.kill();
}, 100000);
