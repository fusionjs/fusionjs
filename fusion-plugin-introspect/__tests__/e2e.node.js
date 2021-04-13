/**
 * @jest-environment node
 * @noflow
 */

/* eslint-env jest, node, browser */

const child_process = require('child_process');
const {promisify} = require('util');
const path = require('path');
const getPort = require('get-port');
const puppeteer = require('puppeteer');

const execFile = promisify(child_process.execFile);
const spawn = child_process.spawn;

const fixture = path.join(__dirname, '__fixtures__/e2e');

test('diagnostics requests respects ROUTE_PREFIX env var', async () => {
  const env = Object.assign({}, process.env, {NODE_ENV: 'development'});
  const ROUTE_PREFIX = '/some-prefix';
  const requests = [];

  const [port] = await Promise.all([
    getPort(),
    execFile('fusion', ['build', '--no-minify', '--skipSourceMaps'], {cwd: fixture, env}),
  ]);

  const server = spawn('fusion', ['start', `--port=${port}`], {
    stdio: 'inherit',
    cwd: fixture,
    env: {
      ...env,
      ROUTE_PREFIX,
    },
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.on('request', req => {
    requests.push(req.url());
  });
  await untilReady(page, port);

  const diagnosticsRequest = requests.filter(r => /diagnostics/.test(r))[0];
  if (!diagnosticsRequest) {
    throw new Error('Could not find diagnostics request');
  }
  const diagnosticsUrl = diagnosticsRequest.replace(
    `http://localhost:${port}`,
    ''
  );
  expect(diagnosticsUrl).toBe(`${ROUTE_PREFIX}/_diagnostics`);

  server.kill();
  browser.close();
}, 30000);

async function untilReady(page, port) {
  let started = false;
  let numTries = 0;
  while (!started && numTries < 20) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await page.goto(`http://localhost:${port}`);
      started = true;
    } catch (e) {
      numTries++;
    }
  }

  if (!started) {
    throw new Error('Failed to start');
  }
}
