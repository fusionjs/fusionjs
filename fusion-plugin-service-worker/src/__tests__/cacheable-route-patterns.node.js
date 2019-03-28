// @flow

/* globals */

import test from 'tape-cup';
import puppeteer from 'puppeteer';
import {startServer, logCachedURLs} from './utils.node';

const precachePaths = [
  '/_static/client-main.js',
  '/_static/client-runtime.js',
  '/_static/client-vendor.js',
];

test('/cacheable-route-patterns', async t => {
  t.plan(8);
  const hostname = 'http://localhost:';
  const {port, proc} = await startServer({
    CACHEABLE_ROUTE_PATTERNS: /\?ok=true/,
  });
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-features=NetworkService',
    ],
    ignoreHTTPSErrors: true,
  });
  try {
    let isReady, allRequests;
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg._text.startsWith('[TEST] cached after first load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          cacheKeys.length === precachePaths.length,
          'first page load: only precachePaths cached'
        );
      } else if (
        msg._text.startsWith(
          '[TEST] cached after navigating to cacheable route:'
        )
      ) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        t.ok(
          cacheKeyPaths.filter(key => key === '/?ok=true').length === 1,
          'document cached when navigating to a cacheable route'
        );
      } else if (
        msg._text.startsWith(
          '[TEST] cached after navigating to non-cacheable route:'
        )
      ) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        t.ok(
          cacheKeyPaths.filter(key => key === '/?ok=true').length === 1,
          'caceheable document still cached when navigating to a non-cacheable route'
        );
        t.ok(
          cacheKeyPaths.filter(key => key === '/?ok=false').length === 0,
          'document not cached when navigating to a non-cacheable route'
        );
      }
    });

    // FIRST LOAD
    await page.goto(`${hostname}${port}`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    await page.waitFor(1000);

    const controller = await page.evaluate(
      'navigator.serviceWorker.controller'
    );
    t.ok(controller, 'first page load: page already claimed service worker');

    await logCachedURLs(page, '[TEST] cached after first load:');

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // NAVIGATE TO CACHEABLE URL
    await page.goto(`${hostname}${port}?ok=true`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    await logCachedURLs(
      page,
      '[TEST] cached after navigating to cacheable route:'
    );

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // NAVIGATE TO NON-CACHEABLE URL
    await page.goto(`${hostname}${port}?ok=false`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    await logCachedURLs(
      page,
      '[TEST] cached after navigating to non-cacheable route:'
    );

    await browser.close();
  } finally {
    proc.kill();
    t.end();
  }
});
