// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const puppeteer = require('puppeteer');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` app with split translations integration', async () => {
  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env, cwd: dir});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('<div data-testid="split">["__SPLIT__"]</div>'),
    'translation keys are added to promise instrumentation'
  );
  t.ok(
    content.includes(
      '<div data-testid="split-with-child">' +
        '["__SPLIT_CHILD__","__SPLIT_WITH_CHILD__"]' +
        '</div>'
    ),
    'translation keys contain keys from child imports'
  );

  browser.close();
  proc.kill('SIGKILL');
}, 100000);
