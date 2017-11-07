import test from 'tape-cup';
import {consumeSanitizedHTML} from 'fusion-core';
import RPC from '../../server';
const EventEmitter = {
  of() {
    return {
      emit() {},
    };
  },
};

test('works', async t => {
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
  const rpc = RPC({handlers, EventEmitter}).of(mockCtx);
  t.equals(typeof rpc.test, 'function', 'has method');
  try {
    const p = rpc.test('test-args');
    t.ok(p instanceof Promise, 'has right return type');
    t.equals(await p, 1, 'method works');
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
  t.throws(() => RPC({handlers, EventEmitter}).of());
  t.end();
});

test('xss protection', async t => {
  const handlers = {
    '<div>'() {
      return 1;
    },
  };
  const Plugin = RPC({handlers, EventEmitter});
  const ctx = {headers: {}, element: 'test', body: {body: []}};
  await Plugin.middleware(ctx, () => Promise.resolve());
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('<div>'), null);
  t.end();
});
