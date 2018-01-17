import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import test from 'tape-cup';
import plugin from '../server.js';
import {UniversalLoggerConfigToken} from '../tokens';

test('Server logger', async t => {
  let called = false;
  class Transport {
    constructor() {
      this.name = 'test-transport';
    }
    log(level, message) {
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
  class Transport {
    constructor() {
      this.name = 'test-transport';
    }
    log(level, message, meta) {
      t.equals(level, 'info', 'level is ok');
      t.equals(message, 'test', 'message is ok');
      t.equals(message, 'test', 'message is ok');
      t.deepLooseEqual(meta, {hello: 'world'}, 'meta is ok');
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
