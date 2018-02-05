import tape from 'tape-cup';
import {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
} from '../virtual/index.js';

tape('virtualModules api', t => {
  t.equal(typeof assetUrl, 'function');
  t.equal(typeof chunkId, 'function');
  t.equal(typeof syncChunkIds, 'function');
  t.equal(typeof syncChunkPaths, 'function');

  t.equal(assetUrl(0), 0);
  t.equal(chunkId(0), 0);
  t.equal(syncChunkIds(0), 0);
  t.equal(syncChunkPaths(0), 0);
  t.end();
});
