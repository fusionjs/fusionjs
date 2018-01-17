import test from 'tape-cup';
import {html, unescape} from '../sanitization';

test('sanitization api is not bundled', t => {
  t.equals(html, void 0);
  t.equals(typeof unescape, 'function');
  t.end();
});
