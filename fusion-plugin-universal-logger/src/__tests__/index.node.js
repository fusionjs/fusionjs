import universalEvents from 'fusion-plugin-universal-events';
import test from 'tape-cup';
import plugin from '../server.js';

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
  const logger = plugin({
    emitter: universalEvents(),
    config: {transports: [new Transport()]},
  });
  logger.info('test');
  t.equals(called, true, 'called');
  t.end();
});
