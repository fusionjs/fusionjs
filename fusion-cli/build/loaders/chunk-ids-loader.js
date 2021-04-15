/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

/*::
import type {ClientChunkMetadataContext} from "./loader-context.js";
*/
const {clientChunkMetadataContextKey} = require('./loader-context.js');

async function chunkIdsLoader() {
  /**
   * This loader is not cacheable because the chunk id for a file is dependent
   * on where/how it is imported, not the file contents itself.
   */
  this.cacheable(false);
  const callback = this.async();
  const options = this.getOptions();

  const chunkMetadataState /*: ClientChunkMetadataContext*/ = this[
    clientChunkMetadataContextKey
  ];

  const filename = options.path;

  if (!chunkMetadataState) {
    return void callback('Chunk index context missing from chunk ids loader.');
  }

  try {
    const source = `module.exports = ${JSON.stringify(
      await getChunks(chunkMetadataState, filename)
    )};`;
    return void callback(null, source);
  } catch (err) {
    return void callback(err);
  }
}

module.exports = chunkIdsLoader;

async function getChunks(
  chunkMetadataState /*: ClientChunkMetadataContext*/,
  filename /*: string*/
) {
  const {fileManifest} = await chunkMetadataState.result;
  const chunks = fileManifest.get(filename);
  if (!chunks) {
    throw new Error(
      `Attempted to get client bundle chunk ids for "${filename}" but it is not the client bundle.`
    );
  }
  return Array.from(chunks.values());
}
