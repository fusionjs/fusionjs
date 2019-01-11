/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import test from 'tape-cup';

import App, {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {LoggerToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import plugin from '../browser.js';

type ExtractReturnType = <V>(() => V) => V;
type IEmitter = $Call<ExtractReturnType, typeof UniversalEventsToken>;

const createMockEmitter = (
  emitCallback: (type: mixed, payload: mixed) => void
): IEmitter => {
  const emitter = {
    from: () => emitter,
    emit: emitCallback,
    setFrequency: () => {},
    teardown: () => {},
    map: () => {},
    on: () => {},
    off: () => {},
    mapEvent: () => {},
    handleEvent: () => {},
    async flush() {
      this.flushCount++;
    },
    flushCount: 0,
  };
  // $FlowFixMe
  return emitter;
};

test('browser logger', t => {
  let called = false;
  const app = new App('el', el => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    t.equal(type, 'universal-log');
    // $FlowFixMe
    t.equal(payload.level, 'info');
    // $FlowFixMe
    t.equal(payload.args[0], 'test');
    called = true;
  });
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  app.register(UniversalEventsToken, mockEmitterPlugin);
  app.middleware({logger: LoggerToken}, ({logger}) => {
    logger.info('test');
    return (ctx, next) => next();
  });
  getSimulator(app);
  t.equals(called, true, 'called');
  t.end();
});

test('browser logger with errors', t => {
  t.plan(6);
  const app = new App('el', el => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    t.equal(type, 'universal-log');
    // $FlowFixMe
    t.equal(payload.level, 'error');
    // $FlowFixMe
    t.equal(payload.args[0], 'some-message');
    // $FlowFixMe
    t.equal(typeof payload.args[1].error.stack, 'string');
    // $FlowFixMe
    t.equal(typeof payload.args[1].error.message, 'string');

    setTimeout(() => {
      // $FlowFixMe
      t.equal(mockEmitter.flushCount, 1, 'error immediately flushed');
    }, 0);
  });
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  app.register(UniversalEventsToken, mockEmitterPlugin);
  app.middleware({logger: LoggerToken}, ({logger}) => {
    logger.error('some-message', new Error('fail'));
    return (ctx, next) => next();
  });
  getSimulator(app);
});

test('browser logger with errors as first argument', t => {
  let called = false;
  const app = new App('el', el => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    t.equal(type, 'universal-log');
    // $FlowFixMe
    t.equal(payload.level, 'error');
    // $FlowFixMe
    t.equal(typeof payload.args[0].error.stack, 'string');
    // $FlowFixMe
    t.equal(typeof payload.args[0].error.message, 'string');
    called = true;
  });
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  app.register(UniversalEventsToken, mockEmitterPlugin);
  app.middleware({logger: LoggerToken}, ({logger}) => {
    logger.error(new Error('fail'));
    return (ctx, next) => next();
  });
  getSimulator(app);
  t.equals(called, true, 'called');
  t.end();
});
