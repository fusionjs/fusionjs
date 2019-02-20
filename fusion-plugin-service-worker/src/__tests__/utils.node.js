// @flow
/* eslint-env jest, node */

import getPort from 'get-port';
import fetch from 'isomorphic-fetch';

export async function startServer() {
  let spawn = require('child_process').spawn;
  const port = await getPort();

  // Spin up server
  const opts = {
    cwd: __dirname + '/../fixture-apps/app',
    stdio: 'inherit',
    env: {...process.env},
  };

  // (function() {
  //   var oldSpawn = spawn;
  //   function mySpawn() {
  //     console.log('spawn called');
  //     console.log(arguments);
  //     var result = oldSpawn.apply(this, arguments);
  //     return result;
  //   }
  //   spawn = mySpawn;
  // })();

  const proc = spawn(
    __dirname + '/../fixture-apps/app/node_modules/.bin/fusion',
    ['dev', '--port', port, '--no-open'],
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
