// @flow
/* eslint-env jest, node */

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);
const {startServer} = require('../test-utils/test-utils.js');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

function log(execOutput) {
  // eslint-disable-next-line no-console
  console.log(execOutput.stdout);
}

const appName = 'test-scaffold';

test('scaffolded app tests pass', async () => {
  await exec(`mkdir test-artifacts`);
  log(
    await exec(`node ../bin/cli.js test-scaffold`, {cwd: './test-artifacts'})
  );

  const options = {cwd: `./test-artifacts/${appName}`};
  log(await exec(`yarn build`, options));

  // Spin up server and validate SSR response
  const {port, proc} = await startServer();

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}`);
  const response = await page.content();
  await browser.close();
  expect(response).toContain('Fusion.js');

  const newPackageJson /*: {[string]:any}*/ = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, `../test-artifacts/${appName}/package.json`),
      'utf-8'
    )
  );
  expect(newPackageJson.name).toEqual(appName);

  proc.kill();
}, 300000);
