// @flow

/* globals */

import puppeteer from 'puppeteer';
import {startServer, logCachedURLs} from './utils.node';

const precachePaths = [
  '/_static/client-main.js',
  '/_static/client-runtime.js',
  '/_static/client-vendor.js',
];

test('/cacheable-route-patterns', async (done) => {
  expect.assertions(8);
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
    page.on('console', (msg) => {
      if (msg._text.startsWith('[TEST] cached after first load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(cacheKeys.length === precachePaths.length).toBeTruthy();
      } else if (
        msg._text.startsWith(
          '[TEST] cached after navigating to cacheable route:'
        )
      ) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map((key) => key.split(port)[1]);
        expect(
          cacheKeyPaths.filter((key) => key === '/?ok=true').length === 1
        ).toBeTruthy();
      } else if (
        msg._text.startsWith(
          '[TEST] cached after navigating to non-cacheable route:'
        )
      ) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map((key) => key.split(port)[1]);
        expect(
          cacheKeyPaths.filter((key) => key === '/?ok=true').length === 1
        ).toBeTruthy();
        expect(
          cacheKeyPaths.filter((key) => key === '/?ok=false').length === 0
        ).toBeTruthy();
      }
    });

    // FIRST LOAD
    await page.goto(`${hostname}${port}`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    expect(isReady).toBeTruthy();

    await page.waitFor(1000);

    const controller = await page.evaluate(
      'navigator.serviceWorker.controller'
    );
    expect(controller).toBeTruthy();

    await logCachedURLs(page, '[TEST] cached after first load:');

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', (req) => {
      allRequests.set(req.url(), req);
    });

    // NAVIGATE TO CACHEABLE URL
    await page.goto(`${hostname}${port}?ok=true`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    expect(isReady).toBeTruthy();

    await logCachedURLs(
      page,
      '[TEST] cached after navigating to cacheable route:'
    );

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', (req) => {
      allRequests.set(req.url(), req);
    });

    // NAVIGATE TO NON-CACHEABLE URL
    await page.goto(`${hostname}${port}?ok=false`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    expect(isReady).toBeTruthy();

    await logCachedURLs(
      page,
      '[TEST] cached after navigating to non-cacheable route:'
    );

    await browser.close();
  } finally {
    proc.kill();
    done();
  }
}, 15000);
