// @flow

/* globals */

import test from 'tape-cup';
import puppeteer from 'puppeteer';
import {startServer, logCachedURLs} from './utils.node';

// from fixture-apps/app
const cacheablePaths = [
  '/_sta./utils.nodein.js',
  '/_static/client-runtime.js',
  '/_static/client-vendor.js',
];

const precachePaths = [
  '/_static/client-main.js',
  '/_static/client-runtime.js',
  '/_static/client-vendor.js',
];

test('/cache expiry', async t => {
  t.plan(6);
  const hostname = 'http://localhost:';
  // for testing, set cache expiry to 4 seconds instead of
  // the default 24 hours.
  const {port, proc} = await startServer({EXPIRY: 4000});
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
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          cacheKeys.length === cacheablePaths.length + 1, // add one for HTML
          'second page load: all cacheable resources cached'
        );
      } else if (msg._text.startsWith('*** from sw: cache expired')) {
        t.pass('cache expired after delay');
      } else if (msg._text.startsWith('[TEST] cached after cache expiry:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          cacheKeys.length === cacheablePaths.length + 1,
          `cached after cache expiry:
all cacheable resources (including document) are re-cached immediately after expiry`
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

    // Capture requests during 2nd load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // SECOND LOAD
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after second load:');

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

    // wait four seconds for cache to expire
    await page.waitFor(4000);

    // THIRD LOAD
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after cache expiry:');

    await browser.close();
  } finally {
    proc.kill();
    t.end();
  }
});
