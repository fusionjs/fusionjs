// @flow

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

test('/response to error', async (done) => {
  expect.assertions(10);
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
    page.on('console', (msg) => {
      if (msg._text.startsWith('[TEST] cached after first load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(cacheKeys.length === precachePaths.length).toBeTruthy();
        expect(
          precachePaths.every((path) =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          )
        ).toBeTruthy();
        expect(!cacheKeys.includes(`${hostname}${port}/`)).toBeTruthy();
      } else if (
        msg._text.startsWith('[TEST] cached after second good load:')
      ) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(
          // add one for HTML
          cacheKeys.length === cacheablePaths.length + 1
        ).toBeTruthy();
        expect(
          cacheablePaths.every((path) =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          )
        ).toBeTruthy();
        expect(cacheKeys.includes(`${hostname}${port}/`)).toBeTruthy();
      } else if (msg._text.startsWith('[TEST] cached after error')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(
          !cacheKeys.includes(`${hostname}${port}/`) &&
            !cacheKeys.includes(`${hostname}${port}/error-200`) &&
            !cacheKeys.includes(`${hostname}${port}/error-500`)
        ).toBeTruthy();
      }
    });

    // 1. FIRST LOAD
    await page.goto(`${hostname}${port}`);

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    expect(isReady).toBeTruthy();

    await page.waitFor(1000);

    controller = await page.evaluate('navigator.serviceWorker.controller');
    expect(controller).toBeTruthy();

    await logCachedURLs(page, '[TEST] cached after first load:');

    // Capture requests during next load.
    const allRequests = new Map();

    page.on('request', (req) => {
      allRequests.set(req.url(), req);
    });

    // 2. TRIGGER 500 BUT WITH GOOD HTML
    await page.goto(`${hostname}${port}/error-500`);
    controller = await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(
      page,
      `[TEST] cached after error (500 BUT WITH GOOD HTML):`
    );

    // 3. RELOAD A GOOD PAGE
    await page.goto(`${hostname}${port}`);
    controller = await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after second good load:');

    // 4. TRIGGER 200 WITH BAD HTML
    await page.goto(`${hostname}${port}/error-200`);
    controller = await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, `[TEST] cached after error (200 WITH BAD HTML):`);

    await browser.close();
  } finally {
    proc.kill();
    done();
  }
}, 15000);
