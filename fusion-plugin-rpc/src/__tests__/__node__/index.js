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
  const handlers = {
    test() {
      return 1;
    },
  };
  const rpc = RPC({handlers, EventEmitter}).of();
  t.equals(typeof rpc.test, 'function', 'has method');
  t.ok(rpc.test() instanceof Promise, 'has right return type');
  try {
    t.equals(await rpc.test(), 1, 'method works');
  } catch (e) {
    t.fail(e);
  }
  t.end();
});
test('xss protection', async t => {
  const handlers = {
    '<div>'() {
      return 1;
    },
  };
  const Plugin = RPC({handlers, EventEmitter});
  const ctx = {element: 'test', body: {body: []}};
  await Plugin.middleware(ctx, () => Promise.resolve());
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('<div>'), null);
  t.end();
});
