/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

const path = require('path');
const puppeteer = require('puppeteer');
const getPort = require('get-port');
const child_process = require('child_process');
const {promisify} = require('util');
const spawn = child_process.spawn;
const execFile = promisify(child_process.execFile);
const request = require('request-promise');

exports.withFixture = async function withFixture(fixture, tests) {
  const cwd = path.join(__dirname, fixture);
  const env = Object.assign({}, process.env, {NODE_ENV: 'production'});

  const [port] = await Promise.all([
    getPort(),
    execFile('fusion', ['build'], {cwd, env}),
  ]);

  const server = spawn('fusion', ['start', `--port=${port}`], {
    stdio: 'inherit',
    cwd,
    env,
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await untilReady(page, port);

  page.on('console', msg => msg.args().forEach(async arg => {
    console.log(await arg.jsonValue());
  }));

  try {
    await tests(page)
  } finally {
    await server.kill();
    await browser.close();
  }
}

exports.Runtime = class Runtime {
  constructor(opts) {
    this.fixturePath = opts.fixture || '.';
    this.collectLogs = opts.collectLogs || false;
    this.started = false;
  }
  async start() {
    const cwd = path.join(__dirname, this.fixturePath);
    const env = Object.assign({}, process.env, {NODE_ENV: 'production'});

    const [port] = await Promise.all([
      getPort(),
      execFile('fusion', ['build'], {cwd, env}),
    ]);
    this.port = port;
    this.url = `http://localhost:${this.port}`;

    this.server = spawn('fusion', ['start', `--port=${port}`], {
      stdio: 'inherit',
      cwd,
      env,
    });

    this.browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();
    await untilReady(this.page, this.port);

    this.started = true;
    if (this.collectLogs) {
      this.page.on('console', msg => msg.args().forEach(async arg => {
        console.log(await arg.jsonValue());
      }));
    }
  }
  request(path) {
    const url = `${this.url}${
      path.startsWith('/') ? path : `/${path}`
    }`;
    return request(url);
  }
  async end() {
    if (this.started) {
      await this.server.kill();
      await this.browser.close();
      this.started = false;
    }
  }
};

async function untilReady(page, port) {
  let started = false;
  let numTries = 0;
  while (!started && numTries < 10) {
    try {
      await page.goto(`http://localhost:${port}`);
      started = true;
    } catch (e) {
      numTries++;
      await new Promise(resolve => {
        setTimeout(resolve, Math.pow(2, numTries));
      });
    }
  }

  if (!started) {
    throw new Error('Failed to start');
  }
};
