/* eslint-env browser */
import universalEvents from 'fusion-plugin-universal-events';
import test from 'tape-cup';
import plugin from '../../browser.js';

test('Server logger', t => {
  let called = false;
  const emitter = universalEvents({fetch: window.fetch});
  const logger = plugin({emitter});
  emitter.on('universal-log', ({args}) => {
    t.equals(args[0], 'test', 'message is ok');
    called = true;
  });
  logger.info('test');
  t.equals(called, true, 'called');
  t.end();
});
