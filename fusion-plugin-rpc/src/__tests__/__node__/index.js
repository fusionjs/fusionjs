import test from 'tape-cup';
import RPC from '../../server';

test('request api', async t => {
  const mockCtx = {
    headers: {},
  };
  const handlers = {
    test(args, ctx) {
      t.equal(args, 'test-args');
      t.equal(ctx, mockCtx);
      return 1;
    },
  };

  const EventEmitter = {
    of() {
      return {
        emit(type, payload) {
          t.equal(type, 'rpc:method');
          t.equal(payload.method, 'test');
          t.equal(payload.status, 'success');
          t.equal(typeof payload.timing, 'number');
        },
      };
    },
  };

  const rpc = RPC({handlers, EventEmitter}).of(mockCtx);
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
  };
  const e = new Error('fail');
  const handlers = {
    test() {
      return Promise.reject(e);
    },
  };

  const EventEmitter = {
    of() {
      return {
        emit(type, payload) {
          t.equal(type, 'rpc:method');
          t.equal(payload.method, 'test');
          t.equal(payload.status, 'failure');
          t.equal(typeof payload.timing, 'number');
          t.equal(payload.error, e);
        },
      };
    },
  };

  const rpc = RPC({handlers, EventEmitter}).of(mockCtx);
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
  };
  const handlers = {};

  const EventEmitter = {
    of() {
      return {
        emit(type, payload) {
          t.equal(type, 'rpc:error');
          t.equal(payload.method, 'test');
          t.equal(payload.origin, 'server');
          t.equal(payload.error.message, 'Missing RPC handler for test');
        },
      };
    },
  };

  const rpc = RPC({handlers, EventEmitter}).of(mockCtx);
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
  };
  const handlers = {
    something: () => {},
    other: () => {},
  };

  const EventEmitter = {
    of() {
      return {
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
      };
    },
  };

  const {middleware} = RPC({handlers, EventEmitter});
  try {
    await middleware(mockCtx, () => Promise.resolve());
    t.equal(
      mockCtx.body.error,
      'Missing RPC handler for valueOf',
      'sets response body'
    );
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

  const EventEmitter = {
    of() {
      return {
        emit(type, payload) {
          t.equal(type, 'rpc:method');
          t.equal(payload.method, 'test');
          t.equal(payload.origin, 'browser');
          t.equal(payload.status, 'success');
          t.equal(typeof payload.timing, 'number');
        },
      };
    },
  };

  const {middleware} = RPC({handlers, EventEmitter});
  try {
    await middleware(mockCtx, () => Promise.resolve());
    t.equal(mockCtx.body, 1);
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
  };
  const e = new Error('Test Failure');
  const handlers = {
    test() {
      return Promise.reject(e);
    },
  };

  const EventEmitter = {
    of() {
      return {
        emit(type, payload) {
          t.equal(type, 'rpc:method');
          t.equal(payload.method, 'test');
          t.equal(payload.origin, 'browser');
          t.equal(payload.status, 'failure');
          t.equal(typeof payload.timing, 'number');
          t.equal(payload.error, e);
        },
      };
    },
  };

  const {middleware} = RPC({handlers, EventEmitter});
  try {
    await middleware(mockCtx, () => Promise.resolve());
    t.equal(mockCtx.body.error, 'Test Failure');
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
    of() {
      return {
        emit() {},
      };
    },
  };

  t.throws(() => RPC({handlers, EventEmitter}).of());
  t.end();
});
