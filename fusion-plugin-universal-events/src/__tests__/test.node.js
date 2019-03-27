/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App, {createPlugin, compose} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import UniversalEventsPlugin, {GlobalEmitter} from '../server.js';
import {UniversalEventsToken} from '../index';
import type {IEmitter} from '../types.js';

test('Instantiation', t => {
  const a = {
    memoized: new Map(),
  };
  const b = {
    memoized: new Map(),
  };
  const Emitter: IEmitter = new GlobalEmitter();
  // $FlowFixMe
  t.notEqual(Emitter.from(a), Emitter.from(b));
  // $FlowFixMe
  t.notEqual(Emitter.from(a), Emitter);
  t.end();
});

test('Server EventEmitter - events from browser', async t => {
  let called = false;
  let globalCalled = false;
  const mockCtx = {
    headers: {},
    method: 'POST',
    path: '/_events',
    request: {
      body: {
        items: [{type: 'a', payload: {x: 1}}],
      },
    },
    timing: {
      end: Promise.resolve(5),
    },
  };
  const app = new App('el', el => el);
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    events.on('a', ({x}, ctx) => {
      t.equals(x, 1, 'payload is correct');
      t.ok(ctx);
      globalCalled = true;
    });
    return (ctx, next) => {
      const ctxEmitter = events.from(ctx);
      ctxEmitter.on('a', ({x}, ctx) => {
        t.equals(x, 1, 'payload is correct');
        t.ok(ctx);
        called = true;
      });
      return next();
    };
  });
  app.resolve();
  try {
    // $FlowFixMe
    await compose(app.plugins)(mockCtx, () => Promise.resolve());
    t.ok(called, 'called');
    t.ok(globalCalled, 'called global handler');
  } catch (e) {
    t.ifErr(e);
  }
  t.end();
});

test('Server EventEmitter - events with ctx', async t => {
  let globalCalled = false;
  const mockCtx = {mock: true};
  const app = new App('el', el => el);
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  app.register(
    createPlugin({
      deps: {events: UniversalEventsToken},
      provides: ({events}) => {
        events.on('b', ({x}, ctx) => {
          t.equals(x, 1, 'payload is correct');
          t.equals(ctx, mockCtx, 'ctx is correct');
          globalCalled = true;
        });
        // $FlowFixMe
        events.emit('b', {x: 1}, mockCtx);
        t.ok(globalCalled, 'called global handler');
        t.end();
      },
    })
  );
  app.resolve();
});

test('Server EventEmitter - mapping', async t => {
  let called = false;
  let globalCalled = false;
  const mockCtx = {
    headers: {},
    method: 'POST',
    path: '/lol',
    timing: {
      end: Promise.resolve(5),
    },
  };
  const app = new App('fake-element', el => el);
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    events.on('a', (payload, c) => {
      t.equal(c, mockCtx, 'ctx is passed to global handlers');
      t.deepLooseEqual(
        payload,
        {x: true, b: true, global: true},
        'payload is correct for global'
      );
      globalCalled = true;
    });
    events.map('a', (payload, c) => {
      t.equal(c, mockCtx, 'ctx is passed to global mappers');
      return {...payload, global: true};
    });
    return (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('a', (payload, c) => {
        t.equal(c, ctx, 'ctx is passed to scoped handlers');
        t.deepLooseEqual(
          payload,
          {x: true, b: true, global: true},
          'payload is correct'
        );
        called = true;
      });
      emitter.map('a', (payload, c) => {
        t.equal(c, ctx, 'ctx is passed to scoped mappers');
        return {...payload, b: true};
      });
      emitter.emit('a', {x: 1});
      return next();
    };
  });
  app.resolve();
  try {
    // $FlowFixMe
    await compose(app.plugins)(mockCtx, () => Promise.resolve());
    t.ok(called, 'called');
    t.ok(globalCalled, 'called global handler');
  } catch (e) {
    t.ifErr(e);
  }
  t.end();
});

test('Server EventEmitter error handling', async t => {
  t.plan(1);
  const app = new App('fake-element', el => el);
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-pre-await', ({x}) => {
        t.equals(x, 1, 'payload is correct');
      });
      emitter.emit('test-pre-await', {x: 1});
      ctx.throw(403, 'error');
      return next();
    };
  });
  app.middleware((ctx, next) => {
    t.fail('should not reach this middleware');
    return next();
  });
  const simulator = getSimulator(app);
  await simulator
    .request('/lol', {method: 'POST'})
    .then(() => {
      t.fail('should throw');
    })
    .catch(() => {});
});

test('Server EventEmitter batching', async t => {
  const app = new App('fake-element', el => el);
  const flags = {
    preawait: false,
    postawait: false,
    postend: false,
    timeout: false,
  };
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-pre-await', ({x}) => {
        t.equals(x, 1, 'payload is correct');
        flags.preawait = true;
      });
      emitter.emit('test-pre-await', {x: 1});
      t.notOk(flags.preawait, 'batches pre await next events');
      // $FlowFixMe
      t.notOk(emitter.flushed, 'waits to flush');
      return next();
    };
  });

  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-post-await', ({x, lol}) => {
        t.equals(x, 1, 'payload is correct');
        t.ok(lol, 'runs mappers');
        flags.postawait = true;
      });
      await next();
      emitter.emit('test-post-await', {x: 1});
      emitter.map(payload => {
        return {
          ...payload,
          lol: true,
        };
      });
      // $FlowFixMe
      t.notOk(emitter.flushed, 'waits to flush');
      t.notOk(flags.postawait, 'batches post await next events');
    };
  });

  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-post-end', ({x, lol}) => {
        t.equals(x, 1, 'payload is correct');
        t.ok(lol, 'runs mappers');
        flags.postend = true;
      });
      ctx.timing.end.then(() => {
        // $FlowFixMe
        t.notOk(emitter.flushed, 'waits to flush');
        emitter.emit('test-post-end', {x: 1});
        t.notOk(flags.postend, 'batches post-end events');
      });
      return next();
    };
  });

  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-timeout', ({x, lol}) => {
        t.equals(x, 1, 'payload is correct');
        t.ok(lol, 'runs mappers');
        flags.timeout = true;
      });
      setTimeout(() => {
        // $FlowFixMe
        t.ok(emitter.flushed, 'has flushed events');
        emitter.emit('test-timeout', {x: 1});
        t.ok(flags.timeout, 'emits events immediately after flushing');
      }, 100);
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.request('/lol', {method: 'POST'});

  setTimeout(() => {
    t.ok(flags.preawait, 'flushes batch from pre-await emitted events');
    t.ok(flags.postawait, 'flushes batch from post-await emitted events');
    t.ok(flags.postend, 'flushes batch from post-end emitted events');
    t.ok(flags.timeout, 'supports emitting events after batch has flushed');
    t.end();
  }, 150);
});
