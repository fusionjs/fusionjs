/* eslint-env node */

const test = require('tape');

const {evergreen} = require('../build/browser-support');

test('evergreen rule is formatted correctly', function(t) {
  t.plan(1);

  const invalid = evergreen.find(rule => !rule.match(/\w+ >= \d+/));
  t.equal(invalid, void 0);
});
