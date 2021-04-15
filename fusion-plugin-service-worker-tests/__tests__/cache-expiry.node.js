// @flow

/* globals */

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

test('/cache expiry', async done => {
  expect.assertions(6);
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
        expect(cacheKeys.length === precachePaths.length).toBeTruthy();
      } else if (msg._text.startsWith('[TEST] cached after second load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(
          // add one for HTML
          cacheKeys.length === cacheablePaths.length + 1
        ).toBeTruthy();
      } else if (msg._text.startsWith('*** from sw: cache expired')) {
        expect(true).toBe(true);
      } else if (msg._text.startsWith('[TEST] cached after cache expiry:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(cacheKeys.length === cacheablePaths.length + 1).toBeTruthy();
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

    // Capture requests during 2nd load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // SECOND LOAD
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after second load:');

    expect(
      Array.from(allRequests.values())
        .filter(req =>
          cacheablePaths.find(
            path =>
              `${hostname}${port}${path}` === req.url() ||
              req.url() === `${hostname}${port}/` // html
          )
        )
        .every(req => req.response() && req.response().fromServiceWorker())
    ).toBeTruthy();

    // wait four seconds for cache to expire
    await page.waitFor(4000);

    // THIRD LOAD
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after cache expiry:');

    await browser.close();
  } finally {
    proc.kill();
    done();
  }
}, 25000);
