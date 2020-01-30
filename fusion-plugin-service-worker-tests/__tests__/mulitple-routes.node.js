// @flow

/* globals */

import puppeteer from 'puppeteer';
import {startServer, logCachedURLs} from './utils.node';

const precachePaths = [
  '/_static/client-main.js',
  '/_static/client-runtime.js',
  '/_static/client-vendor.js',
];

test('/multiple-routes', async done => {
  expect.assertions(6);
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
    let isReady, allRequests;
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg._text.startsWith('[TEST] cached after first load:')) {
        const cacheKeys = msg._text.split('#')[1].split(',');
        expect(cacheKeys.length === precachePaths.length).toBeTruthy();
      } else if (msg._text.startsWith('[TEST] cached after second load:')) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        expect(
          cacheKeyPaths.filter(key => key === '/?page=1').length === 1
        ).toBeTruthy();
      } else if (msg._text.startsWith('[TEST] cached after third load:')) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        expect(
          cacheKeyPaths.filter(key => key === '/?page=2').length === 1
        ).toBeTruthy();
      } else if (msg._text.startsWith('[TEST] cached after fourth load:')) {
        const cacheKeyPaths = msg._text
          .split('#')[1]
          .split(',')
          .map(key => key.split(port)[1]);
        expect(
          cacheKeyPaths.filter(key => key === '/?page=3').length === 1
        ).toBeTruthy();
      }
    });

    // FIRST LOAD
    await page.goto(`${hostname}${port}/?page=1`);

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

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // SECOND LOAD (first document cache)
    await page.goto(`${hostname}${port}/?page=1`);
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after second load:');

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // THIRD LOAD (second document cache)
    await page.goto(`${hostname}${port}/?page=2`);
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after third load:');

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    // FOURTH LOAD (third document cache)
    await page.goto(`${hostname}${port}/?page=3`);
    await page.evaluate('navigator.serviceWorker.controller');

    await logCachedURLs(page, '[TEST] cached after fourth load:');

    // Capture requests during next load.
    allRequests = new Map();

    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    await browser.close();
  } finally {
    proc.kill();
    done();
  }
}, 15000);
