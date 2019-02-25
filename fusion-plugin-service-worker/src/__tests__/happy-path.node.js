// @flow

import test from 'tape-cup';
import puppeteer from 'puppeteer';
import {startServer, logCacheDates, logCachedURLs} from './utils.node';

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

test('/load-time caching', async t => {
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
    let isReady, controller, originalCacheDates;
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
      } else if (msg._text.startsWith('[TEST] cached after second load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          cacheKeys.length === cacheablePaths.length + 1, // add one for HTML
          'second page load: all cacheable resources cached'
        );
        t.ok(
          cacheablePaths.every(path =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          ),
          'second page load: cached resources are same as cacheablePath names'
        );
        t.ok(
          cacheKeys.includes(`${hostname}${port}/`),
          'second page load: cached resources includes html path'
        );
      } else if (msg._text.startsWith('[TEST] cache dates after first load:')) {
        originalCacheDates = msg._text.split('#')[1].split(',');
        t.ok(
          originalCacheDates.length === precachePaths.length,
          'first page load: only precachePaths cached'
        );
      } else if (
        msg._text.startsWith('[TEST] cache dates after second load:')
      ) {
        const newCacheDates = msg._text.split('#')[1].split(',');
        t.ok(
          newCacheDates.length === cacheablePaths.length + 1, // add one for HTML
          'second page load: all cacheable resources cached'
        );
        t.ok(
          newCacheDates.every(cacheDate =>
            originalCacheDates.every(
              oldCacheDate => cacheDate > originalCacheDates
            )
          ),
          'second page load: all cache dates are greater than original cache dates'
        );
      }
    });

    // FIRST LOAD
    await page.goto(`${hostname}${port}`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.notOk(
      controller,
      'first page load: page did not have existing service worker'
    );

    await logCachedURLs(page, '[TEST] cached after first load:');
    await logCacheDates(page, '[TEST] cache dates after first load:');

    // Capture requests during 2nd load.
    const allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // wait one second between loads because puppteer and/or cache API appears to round to nearest second
    await page.waitFor(1000);

    // SECOND LOAD
    await page.reload({waitUntil: 'domcontentloaded'});
    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.ok(
      controller,
      'second page load: page has an existing active service worker'
    );

    await logCachedURLs(page, '[TEST] cached after second load:');
    await logCacheDates(page, '[TEST] cache dates after second load:');

    t.ok(
      Array.from(allRequests.values())
        .filter(req =>
          cacheablePaths.find(
            path =>
              `${hostname}${port}${path}` === req.url() ||
              req.url() === `${hostname}${port}/` // html
          )
        )
        .every(req => req.response() && req.response().fromServiceWorker()),
      'all cacheable resources are fetched from service worker'
    );

    t.ok(
      Array.from(allRequests.values())
        .filter(
          req =>
            !cacheablePaths.find(
              path => `${hostname}${port}${path}` === req.url()
            )
        )
        .every(
          req =>
            req.resourceType() === 'document' || // html always processed by SW
            !req.response() ||
            !req.response().fromServiceWorker()
        ),
      'all non-cacheable resources are not fetched from service worker'
    );

    await browser.close();
  } finally {
    proc.kill();
    t.end();
  }
});
