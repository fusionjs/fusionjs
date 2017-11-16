import tape from 'tape-cup';
import JWTSessionPlugin from '../../jwt-browser';

tape('Browser plugin throws', t => {
  t.doesNotThrow(JWTSessionPlugin, 'browser plugin should not throw');
  t.throws(
    () => JWTSessionPlugin({secret: 'some secret'}),
    'throws when applied with secret'
  );
  t.throws(() => JWTSessionPlugin().of(), 'throws when instantiated');
  t.end();
});
