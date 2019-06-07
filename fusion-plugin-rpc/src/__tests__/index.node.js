/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import MockEmitter from 'events';
import MockReq from 'mock-req';

import App, {createPlugin, createToken} from 'fusion-core';
import type {Context, Token} from 'fusion-core';
import {getSimulator, getService} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {RPCHandlersToken} from '../tokens';
import RPCPlugin from '../server';
import type {IEmitter, RPCServiceType} from '../types.js';
import MockRPCPlugin from '../mock.js';
import ResponseError from '../response-error.js';
import createMockEmitter from './create-mock-emitter';

const MockPluginToken: Token<RPCServiceType> = createToken('test-plugin-token');
const MOCK_JSON_PARAMS = {test: 'test-args'};

const mockService: RPCServiceType = getService(() => {
  const app = new App('content', el => el);
  const mockEmitter: IEmitter = (new MockEmitter(): any);
  // $FlowFixMe
  mockEmitter.from = () => mockEmitter;
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });
  app.register(UniversalEventsToken, mockEmitterPlugin);
  app.register(RPCHandlersToken, {});
  return app;
}, MockRPCPlugin);

/* Test fixtures */
function createTestFixture() {
  const mockHandlers = {};
  const mockEmitter: IEmitter = (new MockEmitter(): any);
  // $FlowFixMe
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

function mockRequest() {
  const req = new MockReq({
    method: 'POST',
    url: '/api/test',
    headers: {
      Accept: 'text/plain',
    },
  });
  req.write(MOCK_JSON_PARAMS);
  req.end();

  return req;
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
        // $FlowFixMe
        t.throws(() => rpcFactory());
        wasResolved = true;
      },
    })
  );
  t.true(wasResolved, 'service was resolved');

  t.end();
});

test('service - request api', async t => {
  const mockCtx: Context = ({
    headers: {},
    memoized: new Map(),
  }: any);
  const mockHandlers = {
    test(args, ctx) {
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit: (type: mixed, payload: Object) => {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.status, 'success');
      t.equal(typeof payload.timing, 'number');
    },
    from() {
      return this;
    },
  });

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(UniversalEventsToken, mockEmitter);
    app.register(RPCHandlersToken, mockHandlers);
    return app;
  };

  const rpcFactory = getService(appCreator, RPCPlugin);
  const rpc = rpcFactory.from(mockCtx);

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
  const mockCtx: Context = ({
    headers: {},
    memoized: new Map(),
  }: any);
  const e = new Error('fail');
  const mockHandlers = {
    test() {
      return Promise.reject(e);
    },
  };
  const mockEmitter = createMockEmitter({
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
  });

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(UniversalEventsToken, mockEmitter);
    app.register(RPCHandlersToken, mockHandlers);
    return app;
  };

  const rpcFactory = getService(appCreator, RPCPlugin);
  const rpc = rpcFactory.from(mockCtx);

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
  const mockCtx: Context = ({
    headers: {},
    memoized: new Map(),
  }: any);
  const mockHandlers = {};
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      t.equal(type, 'rpc:error');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'server');
      t.equal(payload.error.message, 'Missing RPC handler for test');
    },
    from() {
      return this;
    },
  });

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(UniversalEventsToken, mockEmitter);
    app.register(RPCHandlersToken, mockHandlers);
    return app;
  };

  const rpcFactory = getService(appCreator, RPCPlugin);
  const rpc = rpcFactory.from(mockCtx);

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

  const testPlugin = createPlugin({
    deps: {rpcFactory: MockPluginToken},
    middleware: ({rpcFactory}) => {
      t.ok(rpcFactory);
      wasResolved = true;

      return async () => {};
    },
  });
  app.register(testPlugin);

  getSimulator(app);
  t.true(wasResolved, 'middleware was resolved');

  t.end();
});

test('middleware - invalid endpoint', async t => {
  const mockCtx: Context = ({
    headers: {},
    prefix: '',
    path: '/api/valueOf',
    method: 'POST',
    body: {},
    request: {
      body: {},
    },
    memoized: new Map(),
  }: any);
  const mockHandlers = {
    something: () => {},
    other: () => {},
  };
  const mockEmitter = createMockEmitter({
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
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
      },
      mockService
    );
  if (!middleware) {
    t.fail();
    t.end();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    // $FlowFixMe
    t.equal(mockCtx.body.data.message, 'Missing RPC handler for valueOf');
    // $FlowFixMe
    t.equal(mockCtx.body.data.code, 'ERR_MISSING_HANDLER');
    // $FlowFixMe
    t.equal(mockCtx.body.status, 'failure');
    t.equal(mockCtx.status, 404);
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('middleware - valid endpoint', async t => {
  const mockCtx: Context = ({
    headers: {},
    prefix: '',
    path: '/api/test',
    method: 'POST',
    body: {},
    request: {
      body: 'test-args',
    },
  }: any);
  let executedHandler = false;
  const mockHandlers = {
    test(args, ctx) {
      executedHandler = true;
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'success');
      t.equal(typeof payload.timing, 'number');
    },
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
      },
      mockService
    );
  if (!middleware) {
    t.fail();
    t.end();
    return;
  }

  try {
    await middleware(mockCtx, async () => {
      t.equal(executedHandler, false, 'awaits next');
      Promise.resolve();
    });
    t.equal(executedHandler, true);
    // $FlowFixMe
    t.equal(mockCtx.body.data, 1);
    // $FlowFixMe
    t.equal(mockCtx.body.status, 'success');
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('middleware - valid endpoint with route prefix', async t => {
  const mockCtx: Context = ({
    headers: {},
    prefix: '/lol',
    path: '/api/test',
    method: 'POST',
    body: {},
    request: {
      body: 'test-args',
    },
  }: any);
  const mockHandlers = {
    test(args, ctx) {
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'success');
      t.equal(typeof payload.timing, 'number');
    },
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
      },
      mockService
    );
  if (!middleware) {
    t.fail();
    t.end();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    // $FlowFixMe
    t.equal(mockCtx.body.data, 1);
    // $FlowFixMe
    t.equal(mockCtx.body.status, 'success');
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('middleware - valid endpoint failure with ResponseError', async t => {
  const mockCtx: Context = ({
    headers: {},
    prefix: '',
    path: '/api/test',
    method: 'POST',
    body: {},
    request: {
      body: 'test-args',
    },
    memoized: new Map(),
  }: any);
  const e = new ResponseError('Test Failure');
  // $FlowFixMe
  e.code = 'ERR_CODE_TEST';
  // $FlowFixMe
  e.meta = {hello: 'world'};
  const mockHandlers = {
    test() {
      return Promise.reject(e);
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'failure');
      t.equal(typeof payload.timing, 'number');
      t.equal(payload.error, e);
    },
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
      },
      mockService
    );
  if (!middleware) {
    t.fail();
    t.end();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    // $FlowFixMe
    t.equal(mockCtx.body.data.message, e.message);
    // $FlowFixMe
    t.equal(mockCtx.body.data.code, e.code);
    // $FlowFixMe
    t.equal(mockCtx.body.data.meta, e.meta);
    // $FlowFixMe
    t.equal(mockCtx.body.status, 'failure');
    // $FlowFixMe
    t.equal(Object.keys(mockCtx.body).length, 2);
    // $FlowFixMe
    t.equal(Object.keys(mockCtx.body.data).length, 3);
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('middleware - valid endpoint failure with standard error', async t => {
  const mockCtx: Context = ({
    headers: {},
    prefix: '',
    path: '/api/test',
    method: 'POST',
    body: {},
    request: {
      body: 'test-args',
    },
    memoized: new Map(),
  }: any);
  const e = new Error('Test Failure');
  // $FlowFixMe
  e.code = 'ERR_CODE_TEST';
  // $FlowFixMe
  e.meta = {hello: 'world'};
  const mockHandlers = {
    test() {
      return Promise.reject(e);
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'failure');
      t.equal(typeof payload.timing, 'number');
      t.equal(payload.error, e);
    },
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
      },
      mockService
    );
  if (!middleware) {
    t.fail();
    t.end();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    t.equal(
      // $FlowFixMe
      mockCtx.body.data.message,
      'UnknownError - Use ResponseError from fusion-plugin-rpc (or fusion-plugin-rpc-redux-react if you are using React) package for more detailed error messages'
    );
    // $FlowFixMe
    t.equal(mockCtx.body.data.code, undefined);
    // $FlowFixMe
    t.equal(mockCtx.body.data.meta, undefined);
    // $FlowFixMe
    t.equal(mockCtx.body.status, 'failure');
    // $FlowFixMe
    t.equal(Object.keys(mockCtx.body).length, 2);
    // $FlowFixMe
    t.equal(Object.keys(mockCtx.body.data).length, 3);
  } catch (e) {
    t.fail(e);
  }
  t.end();
});

test('throws when not passed ctx', async t => {
  const app = createTestFixture();

  t.plan(1);
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      middleware: ({rpcFactory}) => async () => {
        // $FlowFixMe
        t.throws(() => rpcFactory.from(), 'missing context throws error');
        t.end();
      },
    })
  ).request('/');
});

test('middleware - bodyparser options with very small jsonLimit', async t => {
  const mockCtx: Context = ({
    req: mockRequest(),
    headers: {},
    prefix: '/lol',
    path: '/api/test',
    method: 'POST',
    request: {
      is: mineTypes => mineTypes.some(mineType => mineType.includes('json')),
    },
  }: any);

  const mockHandlers = {
    test(args, ctx) {
      t.deepEqual(args, MOCK_JSON_PARAMS);
      t.equal(ctx, mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'success');
      t.equal(typeof payload.timing, 'number');
    },
  });
  const mockBodyParserOptions = {jsonLimit: '1b'};

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
        bodyParserOptions: mockBodyParserOptions,
      },
      mockService
    );
  if (!middleware) {
    t.fail();
    t.end();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
  } catch (e) {
    t.equal(e.type, 'entity.too.large');
  }
  t.end();
});

test('middleware - bodyparser options with default jsonLimit', async t => {
  const mockCtx: Context = ({
    req: mockRequest(),
    headers: {},
    prefix: '/lol',
    path: '/api/test',
    method: 'POST',
    request: {
      is: mineTypes => mineTypes.some(mineType => mineType.includes('json')),
    },
  }: any);

  const mockHandlers = {
    test(args, ctx) {
      t.deepEqual(args, MOCK_JSON_PARAMS);
      t.equal(ctx, mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      t.equal(type, 'rpc:method');
      t.equal(payload.method, 'test');
      t.equal(payload.origin, 'browser');
      t.equal(payload.status, 'success');
      t.equal(typeof payload.timing, 'number');
    },
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
      },
      mockService
    );
  if (!middleware) {
    t.fail();
    t.end();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
  } catch (e) {
    t.fail(e);
  }
  t.end();
});
