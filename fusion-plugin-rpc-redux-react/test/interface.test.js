/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

const {
  default: Plugin,
  createRPCReducer,
  mock,
  withRPCRedux,
  withRPCReactor,
} = require('..');

test('interface', () => {
  expect(typeof Plugin.provides).toBe('function');
  expect(typeof createRPCReducer).toBe('function');
  expect(typeof mock.provides).toBe('function');
  expect(typeof withRPCRedux).toBe('function');
  expect(typeof withRPCReactor).toBe('function');
});
