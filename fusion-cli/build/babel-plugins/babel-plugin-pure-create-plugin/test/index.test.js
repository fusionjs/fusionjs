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

function getOutput(file) {
  return transformFileSync(__dirname + file, {
    plugins: [plugin],
  }).code;
}

function readExpected(file) {
  return fs.readFileSync(__dirname + file).toString();
}

test('createPlugin default export', () => {
  const output = getOutput('/fixtures/create-plugin-default-export');
  const expected = readExpected('/fixtures/expected-default-export');
  t.equal(output + '\n', expected);
});

test('createPlugin default and named export', () => {
  const output = getOutput('/fixtures/create-plugin-default-and-named');
  const expected = readExpected('/fixtures/expected-default-and-named');
  t.equal(output + '\n', expected);
});

test('createPlugin default export multiline', () => {
  const output = getOutput('/fixtures/create-plugin-default-multiline');
  const expected = readExpected('/fixtures/expected-default-multiline');
  t.equal(output + '\n', expected);
});
