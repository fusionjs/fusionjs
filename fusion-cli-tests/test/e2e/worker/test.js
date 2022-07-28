// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
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
    await new Promise((resolve) => setTimeout(resolve, 100));
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
  proc.kill('SIGKILL');
}, 100000);

test('`fusion build` worker loader client source maps', async () => {
  const dir = path.resolve(__dirname + '/fixture');

  const env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production --modernBuildOnly`, {env});

  const clientDistPath = path.join(
    dir,
    '.fusion',
    'dist',
    'production',
    'client'
  );

  const clientSourceMapFiles = (
    await fs.promises.readdir(clientDistPath)
  ).filter((filePath) => filePath.endsWith('.map'));

  const sourceMaps = (
    await Promise.all(
      clientSourceMapFiles.map((filePath) =>
        fs.promises.readFile(path.join(clientDistPath, filePath), 'utf-8')
      )
    )
  ).map((fileContents) => JSON.parse(fileContents));

  const sources = sourceMaps.reduce((acc, sourceMap) => {
    return [...acc, ...sourceMap.sources];
  }, []);
  const uniqueSources = new Set(sources);

  t(
    uniqueSources.size === sources.length,
    'Generated source maps should not contain duplicate entries for the same source file'
  );
}, 100000);
