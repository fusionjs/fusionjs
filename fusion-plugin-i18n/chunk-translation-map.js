/* eslint-env node */

class ChunkTranslationMap {
  constructor() {
    this.translations = new Map();
  }

  add(filename, chunkIds, translations) {
    for (const chunkId of chunkIds) {
      if (!this.translations.has(chunkId)) {
        this.translations.set(chunkId, new Map());
      }

      const translationsForChunk = this.translations.get(chunkId);
      for (const key of translations) {
        if (!translationsForChunk.has(key)) {
          translationsForChunk.set(key, new Set());
        }

        const filesForTranslation = translationsForChunk.get(key);
        filesForTranslation.add(filename);
      }
    }
  }

  dispose(filename, chunkIds, translations) {
    for (const chunkId of chunkIds) {
      const translationsForChunk = this.translations.get(chunkId);
      for (const key of translations) {
        const filesForTranslation = translationsForChunk.get(key);
        filesForTranslation.delete(filename);

        if (filesForTranslation.size === 0) {
          translationsForChunk.delete(key);
        }
      }
    }
  }

  translationsForChunk(chunkId) {
    if (!this.translations.has(chunkId)) {
      return new Set();
    }
    return this.translations.get(chunkId).keys();
  }
}

module.exports = new ChunkTranslationMap();
