/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
  workerUrl,
} from '../virtual/index.js';

tape('virtualModules api', t => {
  t.equal(typeof assetUrl, 'function');
  t.equal(typeof chunkId, 'function');
  t.equal(typeof syncChunkIds, 'function');
  t.equal(typeof syncChunkPaths, 'function');
  t.equal(typeof workerUrl, 'function');

  t.equal(assetUrl('0'), '0');
  t.equal(chunkId('0'), '0');
  t.equal(syncChunkIds(0), 0);
  t.equal(syncChunkPaths(0), 0);
  t.equal(workerUrl('0'), '0');
  t.end();
});
