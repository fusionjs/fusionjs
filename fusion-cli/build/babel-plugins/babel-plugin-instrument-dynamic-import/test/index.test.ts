/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const t = require('assert');
const {transformFileSync} = require('@babel/core');

const plugin = require('../');

test('instrument dynamic import', () => {
  const output = transformFileSync(__dirname + '/fixtures/input-basic', {
    filename: 'test-fixture.js',
    plugins: [plugin],
  });
  const expected = fs
    .readFileSync(__dirname + '/fixtures/output-basic', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
});
