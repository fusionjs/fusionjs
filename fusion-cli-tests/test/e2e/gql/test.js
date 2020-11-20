// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('axios');
const {printSchema, buildASTSchema} = require('graphql/utilities');
const {validate} = require('graphql/validation');

const puppeteer = require('puppeteer');

const {cmd, start} = require('../utils.js');

const jestConfigPath = require.resolve('fusion-cli/build/jest/jest-config.js');
const countTests = require('../test-jest-app/fixture/src/count-tests');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(100000);

test('`fusion dev` works with gql', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();

  try {
    const serverSchema = buildASTSchema((await request(`${url}/schema`)).data);
    const serverQuery = (await request(`${url}/query`)).data;
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
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {NODE_ENV: 'production'}),
  });
  const url = `http://localhost:${port}`;
  try {
    const serverSchema = buildASTSchema((await request(`${url}/schema`)).data);
    const serverQuery = (await request(`${url}/query`)).data;
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
  proc.kill('SIGKILL');
});

test('`fusion test` with gql macro', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath}`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` coverage with gql', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --coverage`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});
