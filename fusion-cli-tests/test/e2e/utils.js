/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {spawn} = require('child_process');
const getPort = require('get-port');
const request = require('axios');

const binPath = require.resolve('fusion-cli/bin/cli.js');

function makeCommand(args) /*: Array<string> */ {
  if (Array.isArray(args)) {
    if (args[0] !== '-e') {
      return args.map(x => x.split(' ')).reduce((x, y) => x.concat(y));
    }
    return args;
  }
  return [args];
}

function run(
  args /*: any */,
  options /*: any */
) /*: Promise<{stderr: string, stdout: string, code?: number}> */ {
  const opts = {
    stdio: 'inherit',
    ...options,
  };
  const child = spawn('node', makeCommand(args), opts);
  const stdoutLines = [];
  const stderrLines = [];
  const promise = new Promise((resolve, reject) => {
    child.stdout &&
      child.stdout.on('data', data => {
        stdoutLines.push(data.toString());
      });
    child.stderr &&
      child.stderr.on('data', data => {
        stderrLines.push(data.toString());
      });
    child.on('close', code => {
      const stdout = stdoutLines.join('\n');
      const stderr = stderrLines.join('\n');
      if (code === 0 || code === null) {
        resolve({stdout, stderr});
      } else {
        reject({stdout, stderr, code});
      }
    });
    child.on('error', e => {
      reject(e);
    });
  });
  // $FlowFixMe
  promise.proc = child;
  return promise;
}

function cmd(args /*: any */, options /*: any */) {
  return run([binPath, args], options);
}

async function start(args /*: any */, options /*: any */) {
  const port = await getPort();
  // $FlowFixMe
  const {proc} = cmd(`start --port=${port} ${args}`, options);
  const res = await waitForServer(port);
  return {proc, res, port};
}

async function dev(args /*: any */, options /*: any */) {
  const port = await getPort();
  const promise = cmd(`dev --port=${port} --no-open ${args}`, options);
  // $FlowFixMe
  const {proc} = promise;
  const res = await waitForServer(port);
  return {proc, res, port, promise};
}

async function waitForServer(port /*: any */) /*: any */ {
  let started = false;
  let numTries = 0;
  let res;
  while (!started && numTries < 20) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      res = await request(`http://localhost:${port}/`, {
        headers: {
          accept: 'text/html',
        },
        timeout: 1000,
      });
      started = true;
    } catch (e) {
      // Allow returning true for 500 status code errors to test error states
      if (e.status === 500) {
        started = true;
        res = e;
      } else {
        numTries++;
      }
    }
  }
  if (!started) {
    throw new Error('Failed to start server');
  }
  return (res /*: any */).data;
}

module.exports.start = start;
module.exports.dev = dev;
module.exports.run = run;
module.exports.cmd = cmd;
