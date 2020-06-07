/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import App, {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {LoggerToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import plugin from '../src/browser.js';

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

test('browser logger', () => {
  let called = false;
  const app = new App('el', el => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    expect(type).toBe('universal-log');
    // $FlowFixMe
    expect(payload.level).toBe('info');
    // $FlowFixMe
    expect(payload.args[0]).toBe('test');
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
  expect(called).toBe(true);
});

test('browser logger with errors', done => {
  expect.assertions(6);
  const app = new App('el', el => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    expect(type).toBe('universal-log');
    // $FlowFixMe
    expect(payload.level).toBe('error');
    // $FlowFixMe
    expect(payload.args[0]).toBe('some-message');
    // $FlowFixMe
    expect(typeof payload.args[1].error.stack).toBe('string');
    // $FlowFixMe
    expect(typeof payload.args[1].error.message).toBe('string');

    setTimeout(() => {
      // $FlowFixMe
      expect(mockEmitter.flushCount).toBe(1);
      done();
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

test('browser logger with errors as first argument', () => {
  let called = false;
  const app = new App('el', el => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    expect(type).toBe('universal-log');
    // $FlowFixMe
    expect(payload.level).toBe('error');
    // $FlowFixMe
    expect(typeof payload.args[0].error.stack).toBe('string');
    // $FlowFixMe
    expect(typeof payload.args[0].error.message).toBe('string');
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
  expect(called).toBe(true);
});
