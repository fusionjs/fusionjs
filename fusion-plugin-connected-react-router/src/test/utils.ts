/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 */

/* eslint-env node */
const puppeteer = require('puppeteer');
const getPort = require('get-port');
const child_process = require('child_process');
const {promisify} = require('util');

const spawn = child_process.spawn;
const execFile = promisify(child_process.execFile);
const request = require('axios');

/* Test helpers */
module.exports.createMockEmitter = function createMockEmitter(props) {
  const emitter = {
    from: () => {
      return emitter;
    },
    emit: () => {},
    setFrequency: () => {},
    teardown: () => {},
    map: () => {},
    on: () => {},
    off: () => {},
    mapEvent: () => {},
    handleEvent: () => {},
    flush: () => {},
    ...props,
  };
  return emitter;
};

module.exports.Runtime = class Runtime {
  constructor(opts) {
    // @ts-ignore
    this.fixturePath = opts.fixture || '.';
    // @ts-ignore
    this.collectLogs = opts.collectLogs || false;
    // @ts-ignore
    this.started = false;
  }
  async start() {
    // @ts-ignore
    const cwd = this.fixturePath;

    const [port] = await Promise.all([
      getPort(),
      execFile('fusion', ['build'], {cwd}),
    ]);
    // @ts-ignore
    this.port = port;
    // @ts-ignore
    this.url = `http://localhost:${this.port}`;

    // @ts-ignore
    this.server = spawn('fusion', ['start', `--port=${port}`], {
      stdio: 'inherit',
      cwd,
    });

    // @ts-ignore
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // @ts-ignore
    this.page = await this.browser.newPage();
    // @ts-ignore
    await untilReady(this.page, this.port);

    // @ts-ignore
    this.started = true;
    // @ts-ignore
    if (this.collectLogs) {
      // @ts-ignore
      this.page.on('console', (msg) =>
        msg.args().forEach(async (arg) => {
          console.log(await arg.jsonValue()); // eslint-disable-line
        })
      );
    }
  }
  request(path) {
    // @ts-ignore
    const url = `${this.url}${path.startsWith('/') ? path : `/${path}`}`;
    return request(url);
  }
  async end() {
    // @ts-ignore
    if (this.started) {
      // @ts-ignore
      await this.server.kill();
      // @ts-ignore
      await this.browser.close();
      // @ts-ignore
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
      await new Promise((resolve) => {
        setTimeout(resolve, Math.pow(2, numTries));
      });
    }
  }

  if (!started) {
    throw new Error('Failed to start');
  }
}
