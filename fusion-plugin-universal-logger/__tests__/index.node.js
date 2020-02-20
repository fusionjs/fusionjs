/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import TransportStream from 'winston-transport';

import plugin from '../src/server.js';
import {UniversalLoggerConfigToken} from '../src/tokens';

type SupportedLevelsType =
  | 'error'
  | 'warn'
  | 'info'
  | 'verbose'
  | 'debug'
  | 'silly';

test('Server logger', async () => {
  expect.assertions(4);
  class Transport extends TransportStream {
    name: string;

    constructor() {
      super();
      this.name = 'test-transport';
    }
    log({level, message}: {level: SupportedLevelsType, message: string}): void {
      expect(level).toBe('info');
      expect(message).toBe('test message');
    }
  }

  const app = new App('element', el => el);
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(LoggerToken, plugin);
  app.register(UniversalLoggerConfigToken, {transports: [new Transport()]});
  app.middleware(
    {events: UniversalEventsToken, logger: LoggerToken},
    ({events, logger}) => {
      events.on('universal-log', ({args, level}) => {
        expect(args[0]).toBe('test message');
      });

      expect(logger).toBeTruthy();
      logger.info('test message');
      return (ctx, next) => next();
    }
  );
  getSimulator(app);
});

test('Server logger listening on events', async () => {
  let called = false;
  class Transport extends TransportStream {
    name: string;

    constructor() {
      super();
      this.name = 'test-transport';
    }
    log({
      level,
      message,
      hello,
    }: {
      level: SupportedLevelsType,
      message: string,
      hello: string,
    }) {
      expect(level).toBe('info');
      expect(message).toBe('test');
      expect(message).toBe('test');
      expect(hello).toBe('world');
      called = true;
    }
  }
  const app = new App('element', el => el);
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(LoggerToken, plugin);
  app.register(UniversalLoggerConfigToken, {transports: [new Transport()]});
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    events.emit('universal-log', {
      level: 'info',
      args: ['test', {hello: 'world'}],
    });
    return (ctx, next) => next();
  });
  getSimulator(app);
  expect(called).toBe(true);
});
