import tape from 'tape-cup';
import Plugin from '../index';

tape('plugin api', t => {
  t.ok(Plugin);
  t.end();
});
