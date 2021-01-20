/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

/* eslint-env node */
import puppeteer from 'puppeteer';
import getPort from 'get-port';
import child_process from 'child_process';
import {promisify} from 'util';
import axios from 'axios';

const spawn = child_process.spawn;
const execFile = promisify(child_process.execFile);

/* Test helpers */
export const createMockEmitter = function createMockEmitter(props) {
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

export const Runtime = class Runtime {
  constructor(opts) {
    this.fixturePath = opts.fixture || '.';
    this.collectLogs = opts.collectLogs || false;
    this.started = false;
  }
  async start() {
    const cwd = this.fixturePath;
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
      this.page.on('console', msg =>
        msg.args().forEach(async arg => {
          console.log(await arg.jsonValue()); // eslint-disable-line
        })
      );
    }
  }
  request(path) {
    const url = `${this.url}${path.startsWith('/') ? path : `/${path}`}`;
    return axios(url);
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
}
