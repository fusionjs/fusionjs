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

test('/response to redirect', async t => {
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
      if (msg._text.startsWith('[TEST] cached after redirect:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        t.ok(
          cacheKeys.length === cacheablePaths.length + 1, // add one for HTML
          'page load after redirect: all cacheable resources cached'
        );
        t.ok(
          cacheablePaths.every(path =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          ),
          'page load after redirect: cached resources are same as cacheablePath names'
        );
        t.ok(
          cacheKeys.includes(`${hostname}${port}/redirected`) &&
            !cacheKeys.includes(`${hostname}${port}/redirect`),
          'page load after redirect: cached resources includes `redirected` but not `redirect`'
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

    // Capture requests during next load.
    const allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // 2. TRIGGER REDIRECT
    await page.goto(`${hostname}${port}/redirect`);

    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.ok(
      controller,
      'second page load: page has an existing active service worker'
    );

    await logCachedURLs(page, '[TEST] cached after redirect:');

    t.ok(
      Array.from(allRequests.values())
        .filter(req =>
          cacheablePaths.find(
            path =>
              `${hostname}${port}${path}` === req.url() ||
              req.url() === `${hostname}${port}/redirected` // html
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
            req.resourceType() === 'document' || // documents always handled by service worker
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
