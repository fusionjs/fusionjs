/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import test from 'tape-cup';
import {collectMetadata} from '../collectMetadata.js';

test('collectMetadata', t => {
  process.env.FOO = 'foo';
  process.env.BAR = 'bar';
  const data = collectMetadata('.', ['FOO']);
  t.equal(data.nodeVersion.constructor, String, 'nodeVersion is string');
  t.ok(data.nodeVersion.length > 0, 'nodeVersion is non-empty');
  t.equal(data.npmVersion.constructor, String, 'npmVersion is string');
  t.ok(data.npmVersion.length > 0, 'npmVersion is non-empty');
  t.equal(data.yarnVersion.constructor, String, 'yarnVersion is string');
  t.ok(data.yarnVersion.length > 0, 'yarnVersion is non-empty');
  t.equal(data.lockFileType, 'yarn', 'lockFileType is yarn');
  t.equal(data.devDependencies.constructor, Object, 'deps are objects');
  // $FlowFixMe
  t.equal(data.devDependencies['nyc'].constructor, String, 'dep is string');
  // $FlowFixMe
  t.ok(data.devDependencies['nyc'].length > 0, 'dep version is non-empty');
  t.equal(data.varNames.constructor, Array, 'Has available keys');
  t.equal(data.varNames[0].constructor, String, 'Keys are strings');
  t.deepEqual(data.vars, {FOO: 'foo'}, 'Actual values are exposed correctly');
  t.end();
});

test('collectMetadata in hoisted', t => {
  const data = collectMetadata('src/__tests__/__fixtures__/hoisted', []);
  // $FlowFixMe
  t.equal(data.devDependencies['nyc'].constructor, String, 'dep is string');
  t.end();
});

test('collectMetadata w/ npm lock file', t => {
  const data = collectMetadata('src/__tests__/__fixtures__/npm', []);
  t.equal(data.lockFileType, 'npm', 'lock file type is npm');
  t.end();
});

test('collectMetadata outside', t => {
  const data = collectMetadata('/', []);
  t.equal(data.lockFileType, 'none', 'lock file type is none');
  t.deepEqual(data.devDependencies, {}, 'deps are empty');
  t.end();
});
