import tape from 'tape-cup';
import Plugin from '../index';

tape('plugin api', t => {
  t.equal(typeof Plugin, 'function', 'exports a default function');
  t.end();
});
