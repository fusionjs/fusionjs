// @noflow
const test = require('tape');

test('client test runs', async t => {
  t.pass('client test runs');
  await throws();
  t.end();
});

async function throws() {
  throw new Error('browser async error');
}
