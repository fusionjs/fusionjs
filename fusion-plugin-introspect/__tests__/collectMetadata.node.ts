/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import {collectMetadata} from '../src/collectMetadata.js';

test('collectMetadata', () => {
  const NPM_VERSION = '6.14.13';
  const YARN_VERSION = '3.0.0-rc.2.git.20210503.hash-f661129e';
  process.env.FOO = 'foo';
  process.env.BAR = 'bar';
  process.env.npm_config_user_agent = `yarn/${YARN_VERSION} npm/${NPM_VERSION} node/12.20.1 darwin x64`;
  const data = collectMetadata('.', ['FOO']);
  expect(data.nodeVersion.constructor).toBe(String);
  expect(data.nodeVersion.length > 0).toBe(true);
  expect(data.npmVersion).toEqual(NPM_VERSION);
  expect(data.yarnVersion).toEqual(YARN_VERSION);
  // expect(data.lockFileType).toBe('yarn'); // FIXME We don't have lockfiles in each package anymore
  expect(data.devDependencies.constructor).toBe(Object);
  // $FlowFixMe
  expect(data.devDependencies.jest.constructor).toBe(String);
  // $FlowFixMe
  expect(data.devDependencies.jest.length > 0).toBe(true);
  expect(data.varNames.constructor).toBe(Array);
  expect(data.varNames[0].constructor).toBe(String);
  expect(data.vars).toEqual({FOO: 'foo'});
});

test('collectMetadata in hoisted', () => {
  const data = collectMetadata('__tests__/__fixtures__/hoisted', []);
  // $FlowFixMe
  expect(data.devDependencies.jest.constructor).toBe(String);
});

test('collectMetadata w/ npm lock file', () => {
  const data = collectMetadata('__tests__/__fixtures__/npm', []);
  expect(data.lockFileType).toBe('npm');
});

test('collectMetadata outside', () => {
  const data = collectMetadata('/', []);
  expect(data.lockFileType).toBe('none');
  expect(data.devDependencies).toEqual({});
});
