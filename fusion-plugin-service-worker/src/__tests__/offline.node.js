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

test('/works offline', async t => {
  t.plan(10);
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
    let isReady;
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
      } else if (msg._text.startsWith('[TEST] cached after offline load:')) {
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
    const allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // go offline
    await page.setOfflineMode(true);

    // OFFLINE LOAD
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after offline load:');

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
