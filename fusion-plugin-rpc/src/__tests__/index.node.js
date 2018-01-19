/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'tape-cup';
import RPC from '../server';

test('requires ctx', t => {
  const handlers = {};
  const emitter = {
    emit() {},
    from() {
      return this;
    },
  };
  const rpc = RPC({handlers, emitter});
  t.throws(() => rpc());
  t.end();
});

test('request api', async t => {
  const mockCtx = {
    headers: {},
    memoized: new Map(),
  };
  const handlers = {
    test(args, ctx) {
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };

  const emitter = {
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.status, 'success');
      t.equal(typeof payload.timing, 'number');
    },
    from() {
      return this;
    },
  };

  const rpc = RPC({handlers, emitter})(mockCtx);
  t.equals(typeof rpc.request, 'function', 'has request method');
  try {
    const p = rpc.request('test', 'test-args');
    t.ok(p instanceof Promise, 'has right return type');
    t.equals(await p, 1, 'method works');
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('request api with failing request', async t => {
  const mockCtx = {
    headers: {},
    memoized: new Map(),
  };
  const e = new Error('fail');
  const handlers = {
    test() {
      return Promise.reject(e);
    },
  };

  const emitter = {
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.status, 'failure');
      t.equal(typeof payload.timing, 'number');
      t.equal(payload.error, e);
    },
    from() {
      return this;
    },
  };

  const rpc = RPC({handlers, emitter})(mockCtx);
  t.equals(typeof rpc.request, 'function', 'has request method');
  try {
    const p = rpc.request('test', 'test-args');
    t.ok(p instanceof Promise, 'has right return type');
    await p;
  } catch (error) {
    t.equal(error, e);
  }
  t.end();
});

test('request api with invalid endpoint', async t => {
  const mockCtx = {
    headers: {},
    memoized: new Map(),
  };
  const handlers = {};

  const emitter = {
    emit(type, payload) {
      t.equal(type, 'rpc:error');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'server');
      t.equal(payload.error.message, 'Missing RPC handler for test');
    },
    from() {
      return this;
    },
  };

  const rpc = RPC({handlers, emitter})(mockCtx);
  t.equals(typeof rpc.request, 'function', 'has request method');
  try {
    const p = rpc.request('test', 'test-args');
    t.ok(p instanceof Promise, 'has right return type');
    await p;
  } catch (error) {
    t.equal(error.message, 'Missing RPC handler for test');
  }
  t.end();
});

test('middleware - invalid endpoint', async t => {
  const mockCtx = {
    headers: {},
    prefix: '',
    path: '/api/valueOf',
    method: 'POST',
    body: {},
    request: {
      body: {},
    },
    memoized: new Map(),
  };
  const handlers = {
    something: () => {},
    other: () => {},
  };

  const emitter = {
    emit(type, payload) {
      t.equal(type, 'rpc:error');
      t.equal(payload.method, 'valueOf');
      t.equal(payload.origin, 'browser');
      t.equal(
        payload.error.message,
        'Missing RPC handler for valueOf',
        'emits error in payload'
      );
    },
    from() {
      return this;
    },
  };

  const middleware = RPC({handlers, emitter}).__middleware__;
  try {
    await middleware(mockCtx, () => Promise.resolve());
    t.equal(mockCtx.body.data.message, 'Missing RPC handler for valueOf');
    t.equal(mockCtx.body.data.code, 'ERR_MISSING_HANDLER');
    t.equal(mockCtx.body.status, 'failure');
    t.equal(mockCtx.status, 404);
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('middleware - valid endpoint', async t => {
  const mockCtx = {
    headers: {},
    prefix: '',
    path: '/api/test',
    method: 'POST',
    body: {},
    request: {
      body: 'test-args',
    },
  };
  const handlers = {
    test(args, ctx) {
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };

  const emitter = {
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'success');
      t.equal(typeof payload.timing, 'number');
    },
    from() {
      return this;
    },
  };

  const middleware = RPC({handlers, emitter}).__middleware__;
  try {
    await middleware(mockCtx, () => Promise.resolve());
    t.equal(mockCtx.body.data, 1);
    t.equal(mockCtx.body.status, 'success');
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('middleware - valid endpoint failure', async t => {
  const mockCtx = {
    headers: {},
    prefix: '',
    path: '/api/test',
    method: 'POST',
    body: {},
    request: {
      body: 'test-args',
    },
    memoized: new Map(),
  };
  const e = new Error('Test Failure');
  e.code = 'ERR_CODE_TEST';
  e.meta = {hello: 'world'};
  const handlers = {
    test() {
      return Promise.reject(e);
    },
  };

  const emitter = {
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'failure');
      t.equal(typeof payload.timing, 'number');
      t.equal(payload.error, e);
    },
    from() {
      return this;
    },
  };

  const middleware = RPC({handlers, emitter}).__middleware__;
  try {
    await middleware(mockCtx, () => Promise.resolve());
    t.equal(mockCtx.body.data.message, e.message);
    t.equal(mockCtx.body.data.code, e.code);
    t.equal(mockCtx.body.data.meta, e.meta);
    t.equal(mockCtx.body.status, 'failure');
    t.equal(Object.keys(mockCtx.body).length, 2);
    t.equal(Object.keys(mockCtx.body.data).length, 3);
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('throws when not passed ctx', async t => {
  const handlers = {
    test() {
      return 1;
    },
  };

  const EventEmitter = {
    emit() {},
  };

  t.throws(() => RPC({handlers, EventEmitter})());
  t.end();
});
