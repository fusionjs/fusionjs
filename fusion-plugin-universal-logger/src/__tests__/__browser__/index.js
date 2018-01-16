import universalEvents from 'fusion-plugin-universal-events';
import test from 'tape-cup';
import plugin from '../../browser.js';

test('Server logger', t => {
  let called = false;
  const ctx = {};
  const UniversalEvents = universalEvents();
  const Logger = plugin({UniversalEvents});
  UniversalEvents.of(ctx).on('universal-log', ({args}) => {
    t.equals(args[0], 'test', 'message is ok');
    called = true;
  });
  Logger.of(ctx).info('test');
  t.equals(called, true, 'called');
  t.end();
});
