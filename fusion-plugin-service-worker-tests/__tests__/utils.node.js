// @flow
/* eslint-env jest, node */
/* eslint-disable no-console */
/* globals window */

import getPort from 'get-port';
import path from 'path';
import fetch from 'isomorphic-fetch';
import type {Page} from 'puppeteer';

export async function startServer(customEnvVariables: any) {
  let spawn = require('child_process').spawn;
  const port = await getPort();

  // Spin up server
  const opts = {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: {...process.env, ...customEnvVariables},
  };

  const proc = spawn(
    'yarn',
    ['fusion', 'dev', '--port', port, '--no-open'],
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

export async function logCachedURLs(page: Page, label: string) {
  await page.evaluate(
    label =>
      window.caches
        .open('0.0.0')
        .then(cache => cache.keys())
        .then(keys =>
          console.log(
            `${label}#${keys
              .map(key => key.url)
              .filter(Boolean)
              .join(',')}`
          )
        ),
    label
  );
}

export async function logCacheDates(page: Page, label: string) {
  await page.evaluate(async label => {
    const cache = await window.caches.open('0.0.0');
    const requests = await cache.keys();
    const responses = await Promise.all(
      requests.map(request => cache.match(request))
    );
    console.log(
      `${label}#${responses.map(res =>
        new Date(res.headers.get('date')).getTime()
      )}`
    );
  }, label);
}

export const createMockLogger = () => ({
  log: () => createMockLogger(),
  error: () => createMockLogger(),
  warn: () => createMockLogger(),
  info: () => createMockLogger(),
  verbose: () => createMockLogger(),
  debug: () => createMockLogger(),
  silly: () => createMockLogger(),
});
