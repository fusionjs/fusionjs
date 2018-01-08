/* eslint-env node */
const binPath = require.resolve('../bin/cli-runner.js');
const {spawn} = require('child_process');
const getPort = require('get-port');
const request = require('request-promise');

function run(command, options) {
  const opts = {
    stdio: 'inherit',
    ...options,
  };
  const child = spawn('node', ['-e', command], opts);
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
  promise.proc = child;
  return promise;
}

function withRunner(args) {
  return `require('${binPath}').run('${args}')`;
}

function cmd(args, options) {
  return run(withRunner(args), options);
}

async function start(args, options) {
  const port = await getPort();
  const {proc} = cmd(`start --port=${port} ${args}`, options);
  const res = await waitForServer(port);
  return {proc, res};
}

async function dev(args, options) {
  const port = await getPort();
  const {proc} = cmd(`dev --port=${port} --no-open ${args}`, options);
  const res = await waitForServer(port);
  return {proc, res};
}

async function waitForServer(port) {
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
      if (e.statusCode === 500) {
        started = true;
        res = e.response.body;
      } else {
        numTries++;
      }
    }
  }
  if (!started) {
    throw new Error('Failed to start server');
  }
  return res;
}

module.exports.start = start;
module.exports.dev = dev;
module.exports.run = run;
module.exports.cmd = cmd;
