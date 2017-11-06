/* eslint-env browser */
import tape from 'tape-cup';
import Plugin, {styled} from '../index.js';

tape('styletron-react plugin interface', t => {
  t.equal(typeof Plugin, 'function', 'exports a default plugin function');
  t.equal(typeof styled, 'function', 'exports a styled function');
  t.end();
});
