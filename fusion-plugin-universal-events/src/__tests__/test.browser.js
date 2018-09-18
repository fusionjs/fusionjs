/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';

import App from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import plugin from '../browser.js';
import {UniversalEventsToken} from '../index';
import {
  UniversalEventsBatchStorageToken,
  inMemoryBatchStorage as store,
} from '../storage/index.js';

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

test('Browser EventEmitter', async t => {
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

    t.equals(url, '/_events', 'url is ok');
    t.equals(method, 'POST', 'method is ok');
    t.equals(
      // $FlowFixMe
      headers['Content-Type'],
      'application/json',
      'content-type is okay'
    );
    const jsonBody = JSON.parse(body);
    t.equals(jsonBody.items.length, 1, 'data size is ok');
    t.equals(jsonBody.items[0].payload.x, 1, 'data is ok');
    fetched = true;

    return Promise.resolve(createMockFetch({ok: true}));
  };

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      t.equal(emitter, events);
      emitter.on('a', ({x}) => {
        t.equals(x, 1, 'payload is correct');
        emitted = true;
      });
      emitter.emit('a', {x: 1});
      emitter.flush();
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  await new Promise(resolve => setTimeout(resolve, 100));

  t.equals(emitted, true, 'emitted');
  t.equals(fetched, true, 'fetched');
  t.equal(store.data.length, 0, 'queue empty');
  t.end();
});

test('Browser EventEmitter adds events back to queue if they fail to send', async t => {
  const fetch: Fetch = () => Promise.resolve(createMockFetch());

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      t.equal(emitter, events);
      emitter.emit('a', {x: 1});
      emitter.flush();
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  await new Promise(resolve => setTimeout(resolve, 100));

  t.equal(store.data.length, 1, 'event stored when fetch fails');
  t.end();
});

test('Browser EventEmitter adds events back to queue if they fail to send 2', async t => {
  const fetch: Fetch = () => Promise.reject();

  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      t.equal(emitter, events);
      emitter.emit('a', {x: 1});
      emitter.flush();
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  await new Promise(resolve => setTimeout(resolve, 100));

  t.equal(store.data.length, 1, 'event stored when fetch fails');
  t.end();
});
