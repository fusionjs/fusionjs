/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

class ChunkTranslationMap {
  /*:: translations: Map<number | string, Map<string, Set<string>>>; */

  constructor() {
    this.translations = new Map();
  }

  add(
    filename /*: string */,
    chunkIds /*: Array<number | string> */,
    translations /*: Array<string> */
  ) /*: void */ {
    for (const chunkId of chunkIds) {
      if (!this.translations.has(chunkId)) {
        this.translations.set(chunkId, new Map());
      }

      const translationsForChunk = this.translations.get(chunkId);
      if (!translationsForChunk)
        throw new Error('translations missing chunkId');

      for (const key of translations) {
        if (!translationsForChunk.has(key)) {
          translationsForChunk.set(key, new Set());
        }

        const filesForTranslation = translationsForChunk.get(key);
        if (!filesForTranslation)
          throw new Error('unable to get Set() in translations for chunk');

        filesForTranslation.add(filename);
      }
    }
  }

  dispose(
    filename /*: string */,
    chunkIds /*: Array<number> */,
    translations /*: Array<string> */
  ) /*: void */ {
    for (const chunkId of chunkIds) {
      const translationsForChunk = this.translations.get(chunkId);
      if (!translationsForChunk)
        throw new Error('translations missing chunkId');

      for (const key of translations) {
        const filesForTranslation = translationsForChunk.get(key);
        if (!filesForTranslation)
          throw new Error('unable to get Set() in translations for chunk');

        filesForTranslation.delete(filename);

        if (filesForTranslation.size === 0) {
          translationsForChunk.delete(key);
        }
      }
    }
  }

  translationsForChunk(chunkId /*: number | string */) /*: Iterator<string> */ {
    if (!this.translations.has(chunkId)) {
      return new Set().keys();
    }
    const translationsForChunk = this.translations.get(chunkId);
    if (!translationsForChunk) throw new Error('translations missing chunkId');

    return translationsForChunk.keys();
  }
}

module.exports = new ChunkTranslationMap();
