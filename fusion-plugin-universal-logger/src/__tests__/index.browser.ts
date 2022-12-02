/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */
import App, {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {LoggerToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import plugin from '../browser';

type $Call1<F extends (...args: any) => any, A> = F extends (
  a: A,
  ...args: any
) => infer R
  ? R
  : never;
type ExtractReturnType = <V>(a: () => V) => V;
type IEmitter = $Call1<ExtractReturnType, typeof UniversalEventsToken>;

const createMockEmitter = (
  emitCallback: (type: unknown, payload: unknown) => void
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
  return emitter;
};

test('browser logger', () => {
  let called = false;
  const app = new App('el', (el) => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    expect(type).toBe('universal-log');
    // @ts-ignore
    expect(payload.level).toBe('info');
    // @ts-ignore
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

test('browser logger with errors', (done) => {
  expect.assertions(6);
  const app = new App('el', (el) => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    expect(type).toBe('universal-log');
    // @ts-ignore
    expect(payload.level).toBe('error');
    // @ts-ignore
    expect(payload.args[0]).toBe('some-message');
    // @ts-ignore
    expect(typeof payload.args[1].error.stack).toBe('string');
    // @ts-ignore
    expect(typeof payload.args[1].error.message).toBe('string');

    setTimeout(() => {
      // @ts-ignore
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
  const app = new App('el', (el) => el);
  app.register(LoggerToken, plugin);

  const mockEmitter = createMockEmitter((type, payload) => {
    expect(type).toBe('universal-log');
    // @ts-ignore
    expect(payload.level).toBe('error');
    // @ts-ignore
    expect(typeof payload.args[0].error.stack).toBe('string');
    // @ts-ignore
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
