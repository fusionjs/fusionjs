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

import plugin, {UniversalEmitter} from '../src/browser.js';
import {UniversalEventsToken} from '../src/index';
import {
  UniversalEventsBatchStorageToken,
  inMemoryBatchStorage as store,
} from '../src/storage/index.js';

// Set document.visibilityState to test flushBeforeTerminated
Object.defineProperty(document, 'visibilityState', {value: 'hidden'});
const visibilitychangeEvent = new Event('visibilitychange');

/* Test helpers */
function getApp(fetch: Fetch) {
  const app = new App('el', (el) => el);
  app.register(FetchToken, fetch);
  store.getAndClear();
  app.register(UniversalEventsBatchStorageToken, store);
  app.register(UniversalEventsToken, plugin);
  return app;
}

function createMockFetch(responseParams: mixed): Response {
  const mockResponse = new Response();
  // $FlowFixMe
  return {
    ...mockResponse,
    ...responseParams,
  };
}

test('Browser EventEmitter', async () => {
  let fetched = false;
  let emitted = false;
  navigator.sendBeacon = jest.fn((url, payload) => {
    if (!payload) {
      throw new Error(`Expected payload to exist`);
    }

    expect(url).toBe('/_events');
    const jsonBody = JSON.parse(payload.toString());
    expect(jsonBody.items.length).toBe(1);
    expect(jsonBody.items[0].payload.x).toBe(1);
    fetched = true;
    return true;
  });
  const fetch = jest.fn();

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

  expect(navigator.sendBeacon).toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  expect(emitted).toBe(true);
  expect(fetched).toBe(true);
  expect(store.data.length).toBe(0);
});

test('Browser EventEmitter should append routePrefix if sendBeacon API is used', async () => {
  window.__ROUTE_PREFIX__ = '/routePrefix';
  navigator.sendBeacon = jest.fn((url, payload) => {
    expect(url).toBe('/routePrefix/_events');
    return true;
  });
  const fetch = jest.fn();
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
  delete window.__ROUTE_PREFIX__;
});

test('Browser EventEmitter should not routePrefix if fetch API is used since it is appended in csrf plugin', async () => {
  window.__ROUTE_PREFIX__ = '/routePrefix';
  navigator.sendBeacon = undefined;

  const fetch = jest.fn();
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
  expect(fetch).toHaveBeenCalledWith('/_events', expect.anything());
  delete window.__ROUTE_PREFIX__;
});

test('Browser EventEmitter - should fall back to fetch if sendBeacon is not supported', async () => {
  let fetched = false;
  let emitted = false;
  navigator.sendBeacon = undefined;
  const fetch: Fetch = jest.fn((url, options) => {
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
  });

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

  expect(fetch).toHaveBeenCalled();
  expect(emitted).toBe(true);
  expect(fetched).toBe(true);
  expect(store.data.length).toBe(0);
});

test('Browser EventEmitter - should fall back to fetch if beacon fails to enqueue', async () => {
  navigator.sendBeacon = jest.fn(() => false);
  const fetch: Fetch = jest.fn(() =>
    Promise.resolve(createMockFetch({ok: true}))
  );

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

  expect(navigator.sendBeacon).toHaveBeenCalled();
  expect(fetch).toHaveBeenCalled();
  expect(store.data.length).toBe(0);
});

test('Browser EventEmitter - should not send all the events if beacon is too big', async () => {
  navigator.sendBeacon = jest.fn(() => true);
  const fetch: Fetch = jest.fn(() => Promise.resolve(createMockFetch()));

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      expect(emitter).toBe(events);
      emitter.emit('a', {x: 'a'.repeat(40000)});
      emitter.emit('b', {x: 'b'.repeat(40000)});
      window.dispatchEvent(visibilitychangeEvent);
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  expect(navigator.sendBeacon).toHaveBeenCalled();
  expect(store.data.length).toBe(1);
});

test('Browser EventEmitter - should use fetch if single event is larger than beacon limit', async () => {
  navigator.sendBeacon = jest.fn(() => true);
  const fetch: Fetch = jest.fn(() => Promise.resolve(createMockFetch()));

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      expect(emitter).toBe(events);
      emitter.emit('a', {x: 'a'.repeat(100000)});
      window.dispatchEvent(visibilitychangeEvent);
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  expect(fetch).toHaveBeenCalled();
  expect(store.data.length).toBe(0);
});

test('Browser EventEmitter - fetch adds events back to queue if they fail to send', async () => {
  navigator.sendBeacon = undefined;
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

test('Browser EventEmitter - fetch adds events back to queue if they fail to send 2', async () => {
  navigator.sendBeacon = undefined;
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

test('Browser EventEmitter interval', async (done) => {
  navigator.sendBeacon = jest.fn(() => true);
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
  navigator.sendBeacon = jest.fn(() => true);
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

test('Calling flush even no items works as expected', async () => {
  navigator.sendBeacon = jest.fn(() => true);
  store.getAndClear();
  const fetch: Fetch = () => Promise.resolve(createMockFetch());
  const emitter = new UniversalEmitter(fetch, store, 100, 20);
  await emitter.flush();
  await emitter.flush();
  await new Promise((resolve) => setTimeout(resolve, 3000));
  for (let index = 0; index < 20; index++) {
    emitter.emit('a', {x: 1});
  }
  await emitter.flush();
  expect(store.data.length).toBe(0);
  emitter.teardown();
});

test('Fetch lowers limit for 413 errors', async () => {
  navigator.sendBeacon = undefined;
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
  emitter.teardown();
});

const sleep = (ms) => setTimeout(() => {}, ms);

test('Browser EventEmitter does not start a new flush while another one is in progress', async () => {
  navigator.sendBeacon = undefined;
  store.getAndClear();
  let resolveFetch: (result: any) => void = () => {};
  const fetch: Fetch = jest.fn().mockReturnValue(
    new Promise((resolve) => {
      resolveFetch = resolve;
    })
  );
  const emitter = new UniversalEmitter(fetch, store, 2000, 20);
  emitter.emit('a', {x: 1});
  emitter.flush();
  emitter.emit('b', {y: 1});
  emitter.flush();
  emitter.flush();
  // first request is not resolved, only one request at the moment
  expect(fetch).toBeCalledTimes(1);
  resolveFetch(createMockFetch());
  await sleep(1);
  // scheduled flush should be started after first request/flush is resolved
  expect(fetch).toBeCalledTimes(2);
  resolveFetch(createMockFetch());
  await sleep(1);
  // no more additional flush is needed as far as no events were emitted
  expect(fetch).toBeCalledTimes(2);
  emitter.teardown();
});

test('Browser EventEmitter - should not send payloads larger than xhr body limit', async () => {
  const fetch: Fetch = jest.fn(() => Promise.resolve(createMockFetch()));

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      expect(emitter).toBe(events);
      // emit 5 events that are each slighly under half the max payload limit
      emitter.emit('a', {x: 'a'.repeat(1048576 / 2 - 100)});
      emitter.emit('b', {x: 'b'.repeat(1048576 / 2 - 100)});
      emitter.emit('c', {x: 'c'.repeat(1048576 / 2 - 100)});
      emitter.emit('d', {x: 'e'.repeat(1048576 / 2 - 100)});
      emitter.emit('e', {x: 'e'.repeat(1048576 / 2 - 100)});
      window.dispatchEvent(visibilitychangeEvent);
      emitter.teardown();
      return next();
    };
  });

  const simulator = getSimulator(app);
  await simulator.render('/');
  expect(store.data.length).toBe(3);
});
