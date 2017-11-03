import test from 'tape-cup';
import plugin from '../../server.js';
import universalEvents from 'fusion-plugin-universal-events';

test('Server logger', async t => {
  let called = false;
  const ctx = {};
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
  const UniversalEvents = universalEvents();
  const Logger = plugin({
    UniversalEvents,
    config: {transports: [new Transport()]},
  });
  Logger.of(ctx).info('test');
  t.equals(called, true, 'called');
  t.end();
});
