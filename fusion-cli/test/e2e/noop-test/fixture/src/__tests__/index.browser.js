// @noflow
const test = require('tape');

test('client test runs', t => {
  t.pass('client test runs');
  t.pass(`browser __BROWSER__ is ${__BROWSER__}`);
  t.pass(`browser __DEV__ is ${__DEV__}`);
  t.pass(`browser __NODE__ is ${__NODE__}`);
  t.end();
});
