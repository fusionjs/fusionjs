import tape from 'tape-cup';
import plugin from '../../jwt-browser';

tape('Browser plugin throws', t => {
  t.doesNotThrow(plugin, 'browser plugin should not throw');
  t.end();
});
