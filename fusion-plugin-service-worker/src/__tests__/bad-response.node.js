// @flow

import test from 'tape-cup';
import puppeteer from 'puppeteer';
import {startServer, logCachedURLs} from './utils.node';

// from fixture-apps/app
const cacheablePaths = [
  '/_static/client-main.js',
  '/_static/client-runtime.js',
  '/_static/client-vendor.js',
];

const precachePaths = [
  '/_static/client-main.js',
  '/_static/client-runtime.js',
  '/_static/client-vendor.js',
];

test('/response to error', async t => {
  const hostname = 'http://localhost:';
  const {port, proc} = await startServer();
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-features=NetworkService',
    ],
    ignoreHTTPSErrors: true,
  });
  try {
    let isReady, controller;
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg._text.startsWith('[TEST] cached after first load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          cacheKeys.length === precachePaths.length,
          'first page load: only precachePaths cached'
        );
        t.ok(
          precachePaths.every(path =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          ),
          'first page load: cache names are same as precachePaths'
        );
        t.ok(
          !cacheKeys.includes(`${hostname}${port}/`),
          'first page load: html not cached'
        );
      } else if (
        msg._text.startsWith('[TEST] cached after second good load:')
      ) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          cacheKeys.length === cacheablePaths.length + 1, // add one for HTML
          'second good page load: all cacheable resources cached'
        );
        t.ok(
          cacheablePaths.every(path =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          ),
          'second good page load: cached resources are same as cacheablePath names'
        );
        t.ok(
          cacheKeys.includes(`${hostname}${port}/`),
          'second good page load: cached resources includes html path'
        );
      } else if (msg._text.startsWith('[TEST] cached after error')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          !cacheKeys.includes(`${hostname}${port}/`) &&
            !cacheKeys.includes(`${hostname}${port}/error-200`) &&
            !cacheKeys.includes(`${hostname}${port}/error-500`),
          'error page load: no navigation requests cached'
        );
      }
    });

    // 1. FIRST LOAD
    await page.goto(`${hostname}${port}`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.notOk(
      controller,
      'first page load: page did not have existing service worker'
    );

    await logCachedURLs(page, '[TEST] cached after first load:');

    // Capture requests during next load.
    const allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // 2. TRIGGER 500 BUT WITH GOOD HTML
    await page.goto(`${hostname}${port}/error-500`);

    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.ok(
      controller,
      'repeat page load: page has an existing active service worker'
    );

    await logCachedURLs(
      page,
      `[TEST] cached after error (500 BUT WITH GOOD HTML):`
    );

    // 3. RELOAD A GOOD PAGE
    await page.goto(`${hostname}${port}`);
    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.ok(
      controller,
      'repeat page load: page has an existing active service worker'
    );

    await logCachedURLs(page, '[TEST] cached after second good load:');

    // 4. TRIGGER 200 WITH BAD HTML
    await page.goto(`${hostname}${port}/error-200`);

    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.ok(
      controller,
      'repeat page load: page has an existing active service worker'
    );

    await logCachedURLs(page, `[TEST] cached after error (200 WITH BAD HTML):`);

    await browser.close();
  } finally {
    proc.kill();
    t.end();
  }
});
