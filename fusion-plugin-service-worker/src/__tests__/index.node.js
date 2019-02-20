// @flow

/* global window, console */
/* eslint-disable no-console */

import test from 'tape-cup';
import App from 'fusion-core';
import puppeteer from 'puppeteer';
import {getSimulator} from 'fusion-test-utils';
import {startServer} from './utils.node';

import ServiceWorker from '../index';
import {SWTemplateFunctionToken} from '../tokens';
import swTemplateFunction from './fixtures/swTemplate.js';

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

test('/health request', async t => {
  const app = new App('el', el => el);
  app.register(SWTemplateFunctionToken, swTemplateFunction);
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  // Basic /health request
  const ctx_1 = await sim.request('/sw.js');
  t.equal(ctx_1.status, 200, 'sends 200 status on sw request');
  t.ok(
    String(ctx_1.body)
      .trim()
      .replace(/\n/g, '')
      .startsWith(`import {getHandlers} from '../../index'`),
    'sends correct response'
  );
  t.end();

  await app.cleanup();
});

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
    let isReady, controller;
    const page = await browser.newPage();
    await page.goto(`${hostname}${port}`);
    // const response = await page.content();

    page.on('console', msg => {
      if (msg._text.startsWith('[TEST] cached after first load:')) {
        const cacheKeys = msg._text
          .split('#')[1]
          .trim()
          .split(',');
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
      } else {
        if (msg._text.startsWith('[TEST] cached after second load:')) {
          const cacheKeys = msg._text
            .split('#')[1]
            .trim()
            .split(',');
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
      }
    });

    isReady = await page.evaluate('navigator.serviceWorker.ready');
    t.ok(isReady, 'service worker is active');

    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.notOk(
      controller,
      'first page load: page did not have existing service worker'
    );

    await page.evaluate(() =>
      window.caches
        .open('0.0.0')
        .then(cache => cache.keys())
        .then(keys =>
          console.log(
            '[TEST] cached after first load:',
            '#',
            keys.map(key => key.url).join(',')
          )
        )
    );

    // Capture requests during 2nd load.
    const allRequests = new Map();
    page.on('request', req => {
      allRequests.set(req.url(), req);
    });

    await page.reload({waitUntil: 'domcontentloaded'});
    controller = await page.evaluate('navigator.serviceWorker.controller');
    t.ok(
      controller,
      'second page load: page has an existing active service worker'
    );

    await page.evaluate(() =>
      window.caches
        .open('0.0.0')
        .then(cache => cache.keys())
        .then(keys =>
          console.log(
            '[TEST] cached after second load:',
            '#',
            keys.map(key => key.url).join(',')
          )
        )
    );

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
              path =>
                `${hostname}${port}${path}` === req.url() ||
                req.url() === `${hostname}${port}/` // html
            )
        )
        .every(req => !req.response() || !req.response().fromServiceWorker()),
      'all non-cacheable resources are not fetched from service worker'
    );

    await browser.close();
  } finally {
    proc.kill();
    t.end();
  }
});
