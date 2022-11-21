/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
  workerUrl,
} from '../virtual/index';

test('virtualModules api', () => {
  expect(typeof assetUrl).toBe('function');
  expect(typeof chunkId).toBe('function');
  expect(typeof syncChunkIds).toBe('function');
  expect(typeof syncChunkPaths).toBe('function');
  expect(typeof workerUrl).toBe('function');

  expect(assetUrl('0')).toBe('0');
  expect(chunkId('0')).toBe('0');
  expect(syncChunkIds(0)).toBe(0);
  expect(syncChunkPaths(0)).toBe(0);
  expect(workerUrl('0')).toBe('0');
});
