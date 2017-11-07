import test from 'tape-cup';
import plugin, {withBatchEvents} from '../../index.js';

test('test plugin', t => {
  t.ok(typeof plugin === 'function');
  t.end();
});

test('test HOC', t => {
  t.ok(typeof withBatchEvents === 'function');
  t.end();
});
