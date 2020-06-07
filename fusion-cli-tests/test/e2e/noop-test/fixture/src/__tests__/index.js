// @noflow
const test = require('tape');

test('universal test runs', t => {
  t.pass('universal test runs');
  t.pass(`universal __BROWSER__ is ${__BROWSER__}`);
  t.pass(`universal __DEV__ is ${__DEV__}`);
  t.pass(`universal __NODE__ is ${__NODE__}`);
  t.end();
});
