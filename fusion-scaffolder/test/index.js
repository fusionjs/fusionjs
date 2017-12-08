const test = require('tape');
const scaffold = require('../');

test('basic scaffold', async t => {
  await scaffold();
  t.end();
});
