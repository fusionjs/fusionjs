// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('request-promise');
const fs = require('fs');

const puppeteer = require('puppeteer');

const {cmd, start} = require('../utils.js');

const runnerPath = require.resolve('../../../bin/cli-runner');
const countTests = require('../test-jest-app/fixture/src/count-tests');

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` works with gql', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();
  try {
    const expectedSchema = fs
      .readFileSync(path.resolve(dir, 'src/schema.gql'))
      .toString();
    t.equal(
      await request(`${url}/schema`),
      expectedSchema,
      'loads schema on server'
    );
    const page = await app.browser().newPage();
    await page.goto(`${url}/`, {waitUntil: 'load'});
    const browserSchema = await page.evaluate(() => {
      return typeof window !== undefined && window.schema; //eslint-disable-line
    });
    t.equal(browserSchema, expectedSchema, 'loads schema in the browser');
  } catch (e) {
    t.ifError(e);
  }
  app.teardown();
}, 100000);

test('`fusion build --production` works with gql', async () => {
  let browser;
  await await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {NODE_ENV: 'production'}),
  });
  try {
    const expectedSchema = fs
      .readFileSync(path.resolve(dir, 'src/schema.gql'))
      .toString();
    t.equal(
      await request(`http://localhost:${port}/schema`),
      expectedSchema,
      'loads schema on server'
    );
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
    const browserSchema = await page.evaluate(() => {
      return typeof window !== undefined && window.schema; //eslint-disable-line
    });
    t.equal(browserSchema, expectedSchema, 'loads schema in the browser');
  } catch (e) {
    t.ifError(e);
  }
  // $FlowFixMe
  browser.close();
  proc.kill();
}, 100000);

test('`fusion test` with gql macro', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` coverage with gql', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --coverage`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});
