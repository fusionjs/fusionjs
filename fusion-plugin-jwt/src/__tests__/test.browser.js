import tape from 'tape-cup';
import JWTBrowser from '../jwt-browser';

tape('browser api', t => {
  t.equal(typeof JWTBrowser, 'function');
  t.end();
});
