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

test('/cache-busting-route-patterns', async t => {
  t.plan(8);
  const hostname = 'http://localhost:';
  const {port, proc} = await startServer({
    CACHE_BUSTING_PATTERNS: /\?bust=true/,
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
      } else if (msg._text.startsWith('[TEST] cached after second load:')) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        t.ok(
          cacheKeyPaths.filter(key => key === '/').length === 1,
          'second page load: document cached'
        );
      } else if (
        msg._text.startsWith(
          '[TEST] cached after navigating to cache-busting url:'
        )
      ) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        t.ok(
          cacheKeyPaths.filter(key => key === '/' || key === '/?bust=true')
            .length === 0,
          'document cache deleted when navigating to cache-busting route'
        );
      } else if (
        msg._text.startsWith(
          '[TEST] cached after navigating to non-cache-busting url:'
        )
      ) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        t.ok(
          cacheKeyPaths.filter(key => key === '/?bust=false').length === 1,
          'document re-cached when navigating to non-cache-busting route'
        );
      }
    });

    // FIRST LOAD (no cache bust)
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

    // SECOND LOAD (no cache bust)
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after second load:');

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // NAVIGATE TO CACHE-BUSTING URL
    await page.goto(`${hostname}${port}?bust=true`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    await logCachedURLs(
      page,
      '[TEST] cached after navigating to cache-busting url:'
    );

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // NAVIGATE TO NON-CACHE-BUSTING URL
    await page.goto(`${hostname}${port}?bust=false`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    await logCachedURLs(
      page,
      '[TEST] cached after navigating to non-cache-busting url:'
    );

    await browser.close();
  } finally {
    proc.kill();
    t.end();
  }
});
