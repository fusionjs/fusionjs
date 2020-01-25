/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import 'whatwg-fetch'; // Needed for Response global

import App from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import plugin, {UniversalEmitter} from '../browser.js';
import {UniversalEventsToken} from '../index';
import {
  UniversalEventsBatchStorageToken,
  inMemoryBatchStorage as store,
} from '../storage/index.js';

// Set document.visibilityState to test flushBeforeTerminated
Object.defineProperty(document, 'visibilityState', {value: 'hidden'});
const visibilitychangeEvent = new Event('visibilitychange');

/* Test helpers */
function getApp(fetch: Fetch) {
  const app = new App('el', el => el);
  app.register(FetchToken, fetch);
  store.getAndClear();
  app.register(UniversalEventsBatchStorageToken, store);
  app.register(UniversalEventsToken, plugin);
  return app;
}

function createMockFetch(responseParams: mixed): Response {
  const mockResponse = new Response();
  return {
    ...mockResponse,
    ...responseParams,
  };
}

test('Browser EventEmitter', async () => {
  let fetched = false;
  let emitted = false;
  const fetch: Fetch = (url, options) => {
    if (
      !options ||
      !options.method ||
      !options.headers ||
      !options.body ||
      typeof options.body !== 'string'
    ) {
      throw new Error(
        `Expected method, headers, body from options are populated`
      );
    }

    let {method, headers, body} = options;

    expect(url).toBe('/_events');
    expect(method).toBe('POST');
    expect(
      // $FlowFixMe
      headers['Content-Type']
    ).toBe('application/json');
    const jsonBody = JSON.parse(body);
    expect(jsonBody.items.length).toBe(1);
    expect(jsonBody.items[0].payload.x).toBe(1);
    fetched = true;
    return Promise.resolve(createMockFetch());
  };

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      expect(emitter).toBe(events);
      emitter.on('a', ({x}) => {
        expect(x).toBe(1);
        emitted = true;
      });
      emitter.emit('a', {x: 1});
      window.dispatchEvent(visibilitychangeEvent);
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  expect(emitted).toBe(true);
  expect(fetched).toBe(true);
  expect(store.data.length).toBe(0);
});

test('Browser EventEmitter adds events back to queue if they fail to send', async () => {
  const fetch: Fetch = () => Promise.resolve(createMockFetch({ok: false}));

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      expect(emitter).toBe(events);
      emitter.emit('a', {x: 1});
      window.dispatchEvent(visibilitychangeEvent);
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  expect(store.data.length).toBe(1);
});

test('Browser EventEmitter adds events back to queue if they fail to send 2', async () => {
  const fetch: Fetch = () => Promise.reject();

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      expect(emitter).toBe(events);
      emitter.emit('a', {x: 1});
      window.dispatchEvent(visibilitychangeEvent);
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  expect(store.data.length).toBe(1);
});

test('Browser EventEmitter interval', async done => {
  store.getAndClear();
  const emitter = new UniversalEmitter(
    () => {
      return Promise.resolve(createMockFetch());
    },
    {
      add() {},
      addToStart() {},
      getAndClear() {
        expect('Calls storage getAndClear on interval').toBeTruthy();
        emitter.teardown();
        done();
        return [];
      },
    },
    1
  );
});

test('Respects the limit when flushing', async () => {
  store.getAndClear();
  const fetch: Fetch = () => Promise.resolve(createMockFetch());
  const emitter = new UniversalEmitter(fetch, store, 2000, 20);
  for (let index = 0; index < 50; index++) {
    emitter.emit('a', {x: 1});
  }
  await emitter.flush();
  expect(store.data.length).toBe(30);
  await emitter.flush();
  expect(store.data.length).toBe(10);
  await emitter.flush();
  expect(store.data.length).toBe(0);
  emitter.teardown();
});

test('Lowers limit for 413 errors', async () => {
  store.getAndClear();
  const fetch: Fetch = () =>
    Promise.resolve(createMockFetch({status: 413, ok: false}));
  const emitter = new UniversalEmitter(fetch, store, 2000, 20);
  emitter.emit('a', {x: 1});
  await emitter.flush();
  expect(store.data.length).toBe(1);
  expect(emitter.limit).toBe(10);
  await emitter.flush();
  expect(emitter.limit).toBe(5);
  await emitter.flush();
});
