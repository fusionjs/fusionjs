// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('request-promise');
const {printSchema, buildASTSchema} = require('graphql/utilities');
const {validate} = require('graphql/validation');

const puppeteer = require('puppeteer');

const {cmd, start} = require('../utils.js');

const runnerPath = require.resolve('../../../bin/cli-runner');
const countTests = require('../test-jest-app/fixture/src/count-tests');

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(100000);

test('`fusion dev` works with gql', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();

  try {
    const serverSchema = buildASTSchema(
      JSON.parse(await request(`${url}/schema`))
    );
    const serverQuery = JSON.parse(await request(`${url}/query`));
    expect(validate(serverSchema, serverQuery)).toHaveLength(0);
    expect(printSchema(serverSchema)).toMatchInlineSnapshot(`
"type Query {
  user: User
}

type User {
  firstName: String
}
"
`);
    const page = await app.browser().newPage();
    await page.goto(`${url}/`, {waitUntil: 'load'});
    const browserSchema = buildASTSchema(
      await page.evaluate(() => {
      return typeof window !== undefined && window.schema; //eslint-disable-line
      })
    );
    const browserQuery = await page.evaluate(() => {
      return typeof window !== undefined && window.query; //eslint-disable-line
    });
    expect(validate(browserSchema, browserQuery)).toHaveLength(0);
    expect(printSchema(browserSchema)).toMatchInlineSnapshot(`
"type Query {
  user: User
}

type User {
  firstName: String
}
"
`);
  } catch (e) {
    t.ifError(e);
  }
  app.teardown();
});

test('`fusion build --production` works with gql', async () => {
  let browser;
  await await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {NODE_ENV: 'production'}),
  });
  const url = `http://localhost:${port}`;
  try {
    const serverSchema = buildASTSchema(
      JSON.parse(await request(`${url}/schema`))
    );
    const serverQuery = JSON.parse(await request(`${url}/query`));
    expect(validate(serverSchema, serverQuery)).toHaveLength(0);
    expect(printSchema(serverSchema)).toMatchInlineSnapshot(`
"type Query {
  user: User
}

type User {
  firstName: String
}
"
`);
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'load'});
    const browserSchema = buildASTSchema(
      await page.evaluate(() => {
      return typeof window !== undefined && window.schema; //eslint-disable-line
      })
    );
    const browserQuery = await page.evaluate(() => {
      return typeof window !== undefined && window.query; //eslint-disable-line
    });
    expect(validate(browserSchema, browserQuery)).toHaveLength(0);
    expect(printSchema(browserSchema)).toMatchInlineSnapshot(`
"type Query {
  user: User
}

type User {
  firstName: String
}
"
`);
  } catch (e) {
    t.ifError(e);
  }
  // $FlowFixMe
  browser.close();
  proc.kill();
});

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
