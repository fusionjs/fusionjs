// @flow
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const test = require('tape');
const puppeteer = require('puppeteer');
const {dev} = require('./run-command');

async function testHmr(app, t) {
  const dir = path.resolve(__dirname, `fixtures/${app}`);
  const {proc, port} = await dev(`--dir=${dir}`);

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
}

test('test hmr across multiple fixtures', async t => {
  const testDirs = ['hmr-simple-app', 'hmr-with-router'];
  for (let i = 0; i < testDirs.length; i++) {
    await testHmr(testDirs[i], t);
  }
  t.end();
});
