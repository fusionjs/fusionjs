// @flow
/* eslint-env jest, node */

const {spawn} = require('child_process');
const getPort = require('get-port');
const fetch = require('isomorphic-fetch');

async function startServer() {
  const port = await getPort();

  // Spin up server
  const opts = {
    cwd: __dirname + '/../test-artifacts/test-scaffold',
    stdio: 'inherit',
    env: {...process.env},
  };
  const proc = spawn(
    './node_modules/.bin/fusion',
    ['dev', '--port', port],
    opts
  );
  const stdoutLines = [];
  const stderrLines = [];
  proc.stdout &&
    proc.stdout.on('data', (data /*: string*/) => {
      stdoutLines.push(data.toString());
    });
  proc.stderr &&
    proc.stderr.on('data', (data /*: string*/) => {
      stderrLines.push(data.toString());
    });
  proc.on('close', (code /*: number*/) => {
    if (process.env.VERBOSE) {
      const stdout = stdoutLines.join('\n');
      const stderr = stderrLines.join('\n');
      // eslint-disable-next-line no-console
      console.log({stdout, stderr, code});
    }
  });
  proc.on('error', e => {
    // eslint-disable-next-line no-console
    console.log(e);
  });

  // Wait for server to start
  let started = false;
  let numTries = 0;
  let res, initialResponse;
  while (!started && numTries < 20) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      res = await fetch(`http://localhost:${port}/`, {
        headers: {accept: 'text/html'},
      });
      initialResponse = await res.text();

      started = true;
    } catch (e) {
      numTries++;
    }
  }
  if (!started) {
    throw new Error('Failed to start server');
  }
  return {initialResponse, port, proc};
}

module.exports.startServer = startServer;
