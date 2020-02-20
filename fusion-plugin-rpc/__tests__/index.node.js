/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import MockEmitter from 'events';
import MockReq from 'mock-req';
import FormData from 'form-data';

import App, {createPlugin, RouteTagsToken} from 'fusion-core';
import type {Context} from 'fusion-core';
import {getSimulator, getService} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {RPCHandlersToken, RPCToken} from '../src/tokens.js';
import RPCPlugin from '../src/server.js';
import type {IEmitter, RPCServiceType} from '../src/types.js';
import MockRPCPlugin from '../src/mock.js';
import ResponseError from '../src/response-error.js';
import createMockEmitter from './create-mock-emitter';

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
  app.register(RPCHandlersToken, createPlugin({provides: () => ({})}));
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
  app.register(RPCToken, RPCPlugin);
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

test('FusionApp - service resolved', () => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: RPCToken},
      provides: ({rpcFactory}) => {
        expect(rpcFactory).toBeTruthy();
        wasResolved = true;
      },
    })
  );
  expect(wasResolved).toBeTruthy();
});

test('service - requires ctx', () => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: RPCToken},
      provides: ({rpcFactory}) => {
        // $FlowFixMe
        expect(() => rpcFactory()).toThrow();
        wasResolved = true;
      },
    })
  );
  expect(wasResolved).toBeTruthy();
});

test('service - request api', async done => {
  const mockCtx: Context = ({
    headers: {},
    memoized: new Map(),
  }: any);
  const mockHandlers = {
    test(args, ctx) {
      expect(args).toBe('test-args');
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };
  const mockEmitter = createPlugin({
    provides: () =>
      createMockEmitter({
        emit: (type: mixed, payload: Object) => {
          expect(type).toBe('rpc:method');
          expect(payload.method).toBe('test');
          expect(payload.status).toBe('success');
          expect(typeof payload.timing).toBe('number');
        },
        from() {
          return this;
        },
      }),
  });

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(UniversalEventsToken, mockEmitter);
    app.register(RPCToken, RPCPlugin);
    app.register(RPCHandlersToken, mockHandlers);
    return app;
  };

  const sim = getSimulator(appCreator());

  const rpcFactory = sim.getService(RPCToken);
  const routeTags = sim.getService(RouteTagsToken);
  const rpc = rpcFactory.from(mockCtx);

  expect(typeof rpc.request).toBe('function');
  try {
    const p = rpc.request('test', 'test-args');
    expect(p instanceof Promise).toBeTruthy();
    expect(await p).toBe(1);
    expect(routeTags.from(mockCtx).name).toBe('unknown_route');
    //  'does not overwrite the name tag on SSR'
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('service - request api with failing request', async done => {
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
  const mockEmitter = createPlugin({
    provides: () =>
      createMockEmitter({
        emit(type, payload) {
          expect(type).toBe('rpc:method');
          expect(payload.method).toBe('test');
          expect(payload.status).toBe('failure');
          expect(typeof payload.timing).toBe('number');
          expect(payload.error).toBe(e);
        },
        from() {
          return this;
        },
      }),
  });

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(UniversalEventsToken, mockEmitter);
    app.register(RPCHandlersToken, mockHandlers);
    return app;
  };

  const rpcFactory = getService(appCreator, RPCPlugin);
  const rpc = rpcFactory.from(mockCtx);

  expect(typeof rpc.request).toBe('function');
  const p = rpc.request('test', 'test-args');
  expect(p instanceof Promise).toBeTruthy();
  await expect(p).rejects.toThrow(e);
  done();
});

test('service - request api with invalid endpoint', async done => {
  const mockCtx: Context = ({
    headers: {},
    memoized: new Map(),
  }: any);
  const mockHandlers = {};
  const mockEmitter = createPlugin({
    provides: () =>
      createMockEmitter({
        emit(type, payload) {
          expect(type).toBe('rpc:error');
          expect(payload.method).toBe('test');
          expect(payload.origin).toBe('server');
          expect(payload.error.message).toBe('Missing RPC handler for test');
        },
        from() {
          return this;
        },
      }),
  });

  const appCreator = () => {
    const app = new App('content', el => el);
    app.register(UniversalEventsToken, mockEmitter);
    app.register(RPCHandlersToken, mockHandlers);
    return app;
  };

  const rpcFactory = getService(appCreator, RPCPlugin);
  const rpc = rpcFactory.from(mockCtx);

  expect(typeof rpc.request).toBe('function');
  const p = rpc.request('test', 'test-args');
  expect(p instanceof Promise).toBeTruthy();
  await expect(p).rejects.toThrowError('Missing RPC handler for test');
  done();
});

test('FusionJS - middleware resolves', async () => {
  const app = createTestFixture();

  let wasResolved = false;

  const testPlugin = createPlugin({
    deps: {rpcFactory: RPCToken},
    middleware: ({rpcFactory}) => {
      expect(rpcFactory).toBeTruthy();
      wasResolved = true;

      return async () => {};
    },
  });
  app.register(testPlugin);

  getSimulator(app);
  expect(wasResolved).toBeTruthy();
});

test('middleware - invalid endpoint', async done => {
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
      expect(type).toBe('rpc:error');
      expect(payload.method).toBe('valueOf');
      expect(payload.origin).toBe('browser');
      expect(payload.error.message).toBe('Missing RPC handler for valueOf');
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
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    // $FlowFixMe
    expect(mockCtx.body.data.message).toBe('Missing RPC handler for valueOf');
    // $FlowFixMe
    expect(mockCtx.body.data.code).toBe('ERR_MISSING_HANDLER');
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('failure');
    expect(mockCtx.status).toBe(404);
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - valid endpoint', async done => {
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
      expect(args).toBe('test-args');
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });

  const tags = {
    name: 'unknown_route',
  };
  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        RouteTags: {
          from: () => tags,
        },
        emitter: mockEmitter,
        handlers: mockHandlers,
      },
      mockService
    );
  if (!middleware) {
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, async () => {
      expect(executedHandler).toBe(false);
      Promise.resolve();
    });
    expect(tags.name).toBe('test');
    expect(executedHandler).toBe(true);
    // $FlowFixMe
    expect(mockCtx.body.data).toBe(1);
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('success');
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - valid endpoint (custom api path)', async done => {
  const mockCtx: Context = ({
    headers: {},
    prefix: '',
    path: '/test/api/long/test',
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
      expect(args).toBe('test-args');
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
        rpcConfig: {
          apiPath: 'test/api/long',
        },
      },
      mockService
    );
  if (!middleware) {
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, async () => {
      expect(executedHandler).toBe(false);
      Promise.resolve();
    });
    expect(executedHandler).toBe(true);
    // $FlowFixMe
    expect(mockCtx.body.data).toBe(1);
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('success');
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - valid endpoint (custom api path including slashes)', async done => {
  const mockCtx: Context = ({
    headers: {},
    prefix: '',
    path: '/test/api/long/test',
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
      expect(args).toBe('test-args');
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });

  const middleware =
    RPCPlugin.middleware &&
    RPCPlugin.middleware(
      {
        emitter: mockEmitter,
        handlers: mockHandlers,
        rpcConfig: {
          apiPath: '/test///api/long////',
        },
      },
      mockService
    );
  if (!middleware) {
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, async () => {
      expect(executedHandler).toBe(false);
      Promise.resolve();
    });
    expect(executedHandler).toBe(true);
    // $FlowFixMe
    expect(mockCtx.body.data).toBe(1);
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('success');
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - valid endpoint with route prefix', async done => {
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
      expect(args).toBe('test-args');
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
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
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    // $FlowFixMe
    expect(mockCtx.body.data).toBe(1);
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('success');
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - valid endpoint failure with ResponseError', async done => {
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
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('failure');
      expect(typeof payload.timing).toBe('number');
      expect(payload.error).toBe(e);
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
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    // $FlowFixMe
    expect(mockCtx.body.data.message).toBe(e.message);
    // $FlowFixMe
    expect(mockCtx.body.data.code).toBe(e.code);
    // $FlowFixMe
    expect(mockCtx.body.data.meta).toBe(e.meta);
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('failure');
    // $FlowFixMe
    expect(Object.keys(mockCtx.body).length).toBe(2);
    // $FlowFixMe
    expect(Object.keys(mockCtx.body.data).length).toBe(3);
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - valid endpoint failure with standard error', async done => {
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
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('failure');
      expect(typeof payload.timing).toBe('number');
      expect(payload.error).toBe(e);
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
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    expect(
      // $FlowFixMe
      mockCtx.body.data.message
    ).toBe(
      'UnknownError - Use ResponseError from fusion-plugin-rpc (or fusion-plugin-rpc-redux-react if you are using React) package for more detailed error messages'
    );
    // $FlowFixMe
    expect(mockCtx.body.data.code).toBe(undefined);
    // $FlowFixMe
    expect(mockCtx.body.data.meta).toBe(undefined);
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('failure');
    // $FlowFixMe
    expect(Object.keys(mockCtx.body).length).toBe(2);
    // $FlowFixMe
    expect(Object.keys(mockCtx.body.data).length).toBe(3);
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('throws when not passed ctx', async done => {
  const app = createTestFixture();

  expect.assertions(1);
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: RPCToken},
      middleware: ({rpcFactory}) => async () => {
        // $FlowFixMe
        expect(() => rpcFactory.from()).toThrow();
        done();
      },
    })
  ).request('/');
});

test('middleware - bodyparser options with very small jsonLimit', async done => {
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
  let executedHandler = false;
  const mockHandlers = {
    test(args, ctx) {
      executedHandler = true;
      expect(args).toEqual(MOCK_JSON_PARAMS);
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('failure');
      expect(typeof payload.timing).toBe('number');
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
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, async () => {
      expect(executedHandler).toBe(false);
      Promise.resolve();
    });
    expect(executedHandler).toBe(false);
    // $FlowFixMe
    expect(mockCtx.body.status).toBe('failure');
    // $FlowFixMe
    expect(mockCtx.body.data.code).toBe('entity.too.large');
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - bodyparser options with default jsonLimit', async done => {
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
      expect(args).toEqual(MOCK_JSON_PARAMS);
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
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
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});

test('middleware - parse formData', async done => {
  const form = new FormData();
  form.append('name', 'test');
  const req = new MockReq({
    method: 'POST',
    url: '/api/test',
    headers: {
      ...form.getHeaders(),
      'content-length': 3,
    },
  });
  form.pipe(req);
  req.end();
  const mockCtx: Context = ({
    req,
    headers: {
      'content-type': 'multipart/form-data',
    },
    prefix: '/lol',
    path: '/api/test',
    method: 'POST',
    request: {
      is: mineTypes => mineTypes.some(mineType => mineType.includes('json')),
    },
  }: any);

  const mockHandlers = {
    test(args, ctx) {
      expect(args).toEqual({name: 'test'});
      expect(ctx).toBe(mockCtx);
      return 1;
    },
  };

  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method');
      expect(payload.method).toBe('test');
      expect(payload.origin).toBe('browser');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
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
    // $FlowFixMe
    done.fail();
    done();
    return;
  }

  try {
    await middleware(mockCtx, () => Promise.resolve());
    done();
  } catch (e) {
    // $FlowFixMe
    done.fail(e);
  }
});
