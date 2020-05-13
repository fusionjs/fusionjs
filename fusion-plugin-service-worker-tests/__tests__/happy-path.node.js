// @flow

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

test('/happy path', async done => {
  expect.assertions(13);
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
    let isReady, originalCacheDates;
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg._text.startsWith('[TEST] cached after first load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(cacheKeys.length === precachePaths.length).toBeTruthy();
        expect(
          precachePaths.every(path =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          )
        ).toBeTruthy();
        expect(!cacheKeys.includes(`${hostname}${port}/`)).toBeTruthy();
      } else if (msg._text.startsWith('[TEST] cached after second load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(
          // add one for HTML
          cacheKeys.length === cacheablePaths.length + 1
        ).toBeTruthy();
        expect(
          cacheablePaths.every(path =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          )
        ).toBeTruthy();
        expect(cacheKeys.includes(`${hostname}${port}/`)).toBeTruthy();
      } else if (msg._text.startsWith('[TEST] cache dates after first load:')) {
        originalCacheDates = msg._text
          .split('#')[1]
          .split(',')
          .map(n => parseInt(n));
        expect(originalCacheDates.length === precachePaths.length).toBeTruthy();
      } else if (
        msg._text.startsWith('[TEST] cache dates after second load:')
      ) {
        const newCacheDates = msg._text
          .split('#')[1]
          .split(',')
          .map(n => parseInt(n));
        expect(
          // add one for HTML
          newCacheDates.length === cacheablePaths.length + 1
        ).toBeTruthy();
        expect(
          newCacheDates.every(cacheDate =>
            originalCacheDates.every(oldCacheDate => cacheDate > oldCacheDate)
          )
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
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after second load:');
    await logCacheDates(page, '[TEST] cache dates after second load:');

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

    expect(
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
        )
    ).toBeTruthy();

    await browser.close();
  } finally {
    proc.kill();
    done();
  }
}, 15000);
