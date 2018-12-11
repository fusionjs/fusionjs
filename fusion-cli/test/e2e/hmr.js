// @flow
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const t = require('assert');
const puppeteer = require('puppeteer');
const {dev} = require('./utils.js');

module.exports = async function testHmr(dir /*: any */) {
  const {proc, port} = await dev(`--dir=${dir}`);

  // Watcher doesn't pick up changes immediately
  await new Promise(res => setTimeout(res, 500));

  const fixtureContent = fs.readFileSync(
    path.resolve(dir, 'src/home.js'),
    'utf-8'
  );

  // Replace main.js content, simulating a file edit.
  const updatedContent = fixtureContent
    .replace('hmr-component-default', 'hmr-component-replaced')
    .replace('hmr-class-default', 'hmr-class-replaced');

  // Launch the browser and load the page.
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`);

  const content = await page.content();
  t.ok(
    content.includes('hmr-component-default'),
    'default app content contains hmr-component-default'
  );

  // Assert the on-page content has been updated after HMR.
  fs.writeFileSync(path.resolve(dir, 'src/home.js'), updatedContent);
  await page.waitFor('.hmr-class-replaced');

  const newContent = await page.content();
  t.ok(
    newContent.includes('hmr-component-replaced'),
    'default app content contains hmr-component-replaced'
  );

  // Restore content
  fs.writeFileSync(path.resolve(dir, 'src/home.js'), fixtureContent);

  await browser.close();
  proc.kill();
};
