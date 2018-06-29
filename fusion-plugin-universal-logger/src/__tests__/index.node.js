/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';

import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import TransportStream from 'winston-transport';

import plugin from '../server.js';
import {UniversalLoggerConfigToken} from '../tokens';

type SupportedLevelsType =
  | 'error'
  | 'warn'
  | 'info'
  | 'verbose'
  | 'debug'
  | 'silly';

test('Server logger', async t => {
  let called = false;
  class Transport extends TransportStream {
    name: string;

    constructor() {
      super();
      this.name = 'test-transport';
    }
    log({level, message}: {level: SupportedLevelsType, message: string}): void {
      t.equals(level, 'info', 'level is ok');
      t.equals(message, 'test', 'message is ok');
      called = true;
    }
  }

  const app = new App('element', el => el);
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(LoggerToken, plugin);
  app.register(UniversalLoggerConfigToken, {transports: [new Transport()]});
  app.middleware({logger: LoggerToken}, ({logger}) => {
    t.ok(logger);
    logger.info('test');
    return (ctx, next) => next();
  });
  getSimulator(app);
  t.equals(called, true, 'called');
  t.end();
});

test('Server logger listening on events', async t => {
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
      t.equals(level, 'info', 'level is ok');
      t.equals(message, 'test', 'message is ok');
      t.equals(message, 'test', 'message is ok');
      t.equals(hello, 'world', 'meta is ok');
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
  t.equals(called, true, 'called');
  t.end();
});
