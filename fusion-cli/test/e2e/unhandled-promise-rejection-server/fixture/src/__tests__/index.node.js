// @noflow
const test = require('tape');

test('server test runs', async t => {
  t.pass('server test runs');
  await throws();
  t.end();
});

async function throws() {
  throw new Error('server async error');
}
