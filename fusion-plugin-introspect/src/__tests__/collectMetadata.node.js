/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import {collectMetadata} from '../collectMetadata.js';

test('collectMetadata', () => {
  process.env.FOO = 'foo';
  process.env.BAR = 'bar';
  const data = collectMetadata('.', ['FOO']);
  expect(data.nodeVersion.constructor).toBe(String);
  expect(data.nodeVersion.length > 0).toBe(true);
  expect(data.npmVersion.constructor).toBe(String);
  expect(data.npmVersion.length > 0).toBe(true);
  expect(data.yarnVersion.constructor).toBe(String);
  expect(data.yarnVersion.length > 0).toBe(true);
  expect(data.lockFileType).toBe('yarn');
  expect(data.devDependencies.constructor).toBe(Object);
  // $FlowFixMe
  expect(data.devDependencies['jest'].constructor).toBe(String);
  // $FlowFixMe
  expect(data.devDependencies['jest'].length > 0).toBe(true);
  expect(data.varNames.constructor).toBe(Array);
  expect(data.varNames[0].constructor).toBe(String);
  expect(data.vars).toEqual({FOO: 'foo'});
});

test('collectMetadata in hoisted', () => {
  const data = collectMetadata('src/__tests__/__fixtures__/hoisted', []);
  // $FlowFixMe
  expect(data.devDependencies['jest'].constructor).toBe(String);
});

test('collectMetadata w/ npm lock file', () => {
  const data = collectMetadata('src/__tests__/__fixtures__/npm', []);
  expect(data.lockFileType).toBe('npm');
});

test('collectMetadata outside', () => {
  const data = collectMetadata('/', []);
  expect(data.lockFileType).toBe('none');
  expect(data.devDependencies).toEqual({});
});
