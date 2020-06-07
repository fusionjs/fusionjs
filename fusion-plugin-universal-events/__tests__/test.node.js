/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App, {createPlugin, compose} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import UniversalEventsPlugin, {GlobalEmitter} from '../src/server.js';
import {UniversalEventsToken} from '../src/index';
import type {IEmitter} from '../src/types.js';

test('Instantiation', () => {
  const a = {
    memoized: new Map(),
  };
  const b = {
    memoized: new Map(),
  };
  const Emitter: IEmitter = new GlobalEmitter();
  // $FlowFixMe
  expect(Emitter.from(a)).not.toBe(Emitter.from(b));
  // $FlowFixMe
  expect(Emitter.from(a)).not.toBe(Emitter);
});

test('Server EventEmitter - events from browser', async () => {
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
      expect(x).toBe(1);
      expect(ctx).toBeTruthy();
      globalCalled = true;
    });
    return (ctx, next) => {
      const ctxEmitter = events.from(ctx);
      ctxEmitter.on('a', ({x}, ctx) => {
        expect(x).toBe(1);
        expect(ctx).toBeTruthy();
        called = true;
      });
      return next();
    };
  });
  app.resolve();
  await expect(
    // $FlowFixMe
    compose(app.plugins)(mockCtx, () => Promise.resolve())
  ).resolves.not.toThrow();
  expect(called).toBeTruthy();
  expect(globalCalled).toBeTruthy();
});

test('Server EventEmitter - events with ctx', async done => {
  let globalCalled = false;
  const mockCtx = {mock: true};
  const app = new App('el', el => el);
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  app.register(
    createPlugin({
      deps: {events: UniversalEventsToken},
      provides: ({events}) => {
        events.on('b', ({x}, ctx) => {
          expect(x).toBe(1);
          expect(ctx).toBe(mockCtx);
          globalCalled = true;
        });
        // $FlowFixMe
        events.emit('b', {x: 1}, mockCtx);
        expect(globalCalled).toBeTruthy();
        done();
      },
    })
  );
  app.resolve();
});

test('Server EventEmitter - mapping', async () => {
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
      expect(c).toBe(mockCtx);
      expect(payload).toStrictEqual({x: 1, b: true, global: true});
      globalCalled = true;
    });
    events.map('a', (payload, c) => {
      expect(c).toBe(mockCtx);
      return {...payload, global: true};
    });
    return (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('a', (payload, c) => {
        expect(c).toBe(ctx);
        expect(payload).toStrictEqual({x: 1, b: true, global: true});
        called = true;
      });
      emitter.map('a', (payload, c) => {
        expect(c).toBe(ctx);
        return {...payload, b: true};
      });
      emitter.emit('a', {x: 1});
      return next();
    };
  });
  app.resolve();
  await expect(
    // $FlowFixMe
    compose(app.plugins)(mockCtx, () => Promise.resolve())
  ).resolves.not.toThrow();
  expect(called).toBeTruthy();
  expect(globalCalled).toBeTruthy();
});

test('Server EventEmitter error handling', async done => {
  expect.assertions(1);
  const app = new App('fake-element', el => el);
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-pre-await', ({x}) => {
        expect(x).toBe(1);
      });
      emitter.emit('test-pre-await', {x: 1});
      ctx.throw(403, 'error');
      return next();
    };
  });
  app.middleware((ctx, next) => {
    // $FlowFixMe
    done.fail('should not reach this middleware');
    return next();
  });
  const simulator = getSimulator(app);
  await simulator
    .request('/lol', {method: 'POST'})
    .then(() => {
      // $FlowFixMe
      done.fail('should throw');
    })
    .catch(() => {});
  done();
});

test('Server EventEmitter batching', async done => {
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
        expect(x).toBe(1);
        flags.preawait = true;
      });
      emitter.emit('test-pre-await', {x: 1});
      expect(flags.preawait).toBeFalsy();
      // $FlowFixMe
      expect(emitter.flushed).toBeFalsy();
      return next();
    };
  });

  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-post-await', ({x, lol}) => {
        expect(x).toBe(1);
        expect(lol).toBeTruthy();
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
      expect(emitter.flushed).toBeFalsy();
      expect(flags.postawait).toBeFalsy();
    };
  });

  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-post-end', ({x, lol}) => {
        expect(x).toBe(1);
        expect(lol).toBeTruthy();
        flags.postend = true;
      });
      ctx.timing.end.then(() => {
        // $FlowFixMe
        expect(emitter.flushed).toBeFalsy();
        emitter.emit('test-post-end', {x: 1});
        expect(flags.postend).toBeFalsy();
      });
      return next();
    };
  });

  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return async (ctx, next) => {
      const emitter = events.from(ctx);
      emitter.on('test-timeout', ({x, lol}) => {
        expect(x).toBe(1);
        expect(lol).toBeTruthy();
        flags.timeout = true;
      });
      setTimeout(() => {
        // $FlowFixMe
        expect(emitter.flushed).toBeTruthy();
        emitter.emit('test-timeout', {x: 1});
        expect(flags.timeout).toBeTruthy();
      }, 100);
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.request('/lol', {method: 'POST'});

  setTimeout(() => {
    expect(flags.preawait).toBeTruthy();
    expect(flags.postawait).toBeTruthy();
    expect(flags.postend).toBeTruthy();
    expect(flags.timeout).toBeTruthy();
    done();
  }, 150);
});
