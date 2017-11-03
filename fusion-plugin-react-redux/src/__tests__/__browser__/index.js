import tape from 'tape-cup';

// rollup browser build doesn't work with react due to broken {Children} import.
tape('noop test', t => {
  t.end();
});
