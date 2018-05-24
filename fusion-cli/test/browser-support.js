/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const test = require('tape');

const {evergreen} = require('../build/browser-support');

test('evergreen rule is formatted correctly', function(t) {
  t.plan(1);

  const invalid = evergreen.find(rule => !rule.match(/\w+ >= \d+/));
  t.equal(invalid, void 0);
});
