import tape from 'tape-cup';

import plugin from '../browser';

tape('browser', t => {
  t.doesNotThrow(plugin);
  t.throws(() => plugin({}));
  t.throws(() => plugin().of());
  t.end();
});
