// @noflow
const test = require('tape');

const foo = require('../foo.js');

test('universal test', t => {
  t.pass('some universal test');
  t.end();
});
