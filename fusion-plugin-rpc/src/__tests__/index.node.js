/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'tape-cup';
import MockEmitter from 'events';

import App, {createPlugin} from 'fusion-core';
import {createToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {RPCHandlersToken} from '../tokens';
import RPCPlugin from '../server';

const MockPluginToken = createToken('test-plugin-token');
function createTestFixture() {
  const mockHandlers = {};
  const mockEmitter = new MockEmitter();
  mockEmitter.from = () => mockEmitter;
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  const app = new App('content', el => el);
  app.register(UniversalEventsToken, mockEmitterPlugin);
  app.register(RPCHandlersToken, mockHandlers);
  app.register(MockPluginToken, RPCPlugin);
  return app;
}

test('FusionApp - service resolved', t => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: ({rpcFactory}) => {
        t.ok(rpcFactory);
        wasResolved = true;
      },
    })
  );
  t.true(wasResolved, 'service was resolved');

  t.end();
});

test('service - requires ctx', t => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: ({rpcFactory}) => {
        t.throws(() => rpcFactory());
        wasResolved = true;
      },
    })
  );
  t.true(wasResolved, 'service was resolved');

  t.end();
});

test('service - request api', async t => {
  const mockCtx = {
    headers: {},
    memoized: new Map(),
  };
  const mockHandlers = {
    test(args, ctx) {
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };
  const mockEmitter = {
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

  const rpcFactory = RPCPlugin.provides({
    emitter: mockEmitter,
    handlers: mockHandlers,
  });
  const rpc = rpcFactory(mockCtx);

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

test('service - request api with failing request', async t => {
  const mockCtx = {
    headers: {},
    memoized: new Map(),
  };
  const e = new Error('fail');
  const mockHandlers = {
    test() {
      return Promise.reject(e);
    },
  };
  const mockEmitter = {
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

  const rpcFactory = RPCPlugin.provides({
    emitter: mockEmitter,
    handlers: mockHandlers,
  });
  const rpc = rpcFactory(mockCtx);

  t.equals(typeof rpc.request, 'function', 'has request method');
  const p = rpc.request('test', 'test-args');
  t.ok(p instanceof Promise, 'has right return type');
  try {
    await p;
    t.fail('should throw before this point');
  } catch (error) {
    t.equal(error, e);
  }
  t.end();
});

test('service - request api with invalid endpoint', async t => {
  const mockCtx = {
    headers: {},
    memoized: new Map(),
  };
  const mockHandlers = {};
  const mockEmitter = {
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

  const rpcFactory = RPCPlugin.provides({
    emitter: mockEmitter,
    handlers: mockHandlers,
  });
  const rpc = rpcFactory(mockCtx);

  t.equals(typeof rpc.request, 'function', 'has request method');
  const p = rpc.request('test', 'test-args');
  t.ok(p instanceof Promise, 'has right return type');
  try {
    await p;
    t.fail('should throw before this point');
  } catch (error) {
    t.equal(error.message, 'Missing RPC handler for test');
  }
  t.end();
});

test('FusionJS - middleware resolves', async t => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      middleware: ({rpcFactory}) => {
        t.ok(rpcFactory);
        wasResolved = true;
      },
    })
  );
  t.true(wasResolved, 'middleware was resolved');

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
  const mockHandlers = {
    something: () => {},
    other: () => {},
  };
  const mockEmitter = {
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

  const middleware = RPCPlugin.middleware({
    emitter: mockEmitter,
    handlers: mockHandlers,
  });
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
  const mockHandlers = {
    test(args, ctx) {
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };
  const mockEmitter = {
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

  const middleware = RPCPlugin.middleware({
    emitter: mockEmitter,
    handlers: mockHandlers,
  });
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
  const mockHandlers = {
    test() {
      return Promise.reject(e);
    },
  };
  const mockEmitter = {
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

  const middleware = RPCPlugin.middleware({
    emitter: mockEmitter,
    handlers: mockHandlers,
  });
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
  const app = createTestFixture();

  t.pass(1);
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      middleware: ({rpcFactory}) => () => {
        t.throws(() => rpcFactory(), 'missing context throws error');
        t.end();
      },
    })
  ).request('/');
});
