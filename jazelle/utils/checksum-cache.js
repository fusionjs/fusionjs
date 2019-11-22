// @flow
const {dirname} = require('path');
const {exists, read, write, spawn, exec, lstat} = require('./node-helpers.js');

// checksumCache may be called multiple times in parallel
// and fs.writeFile(cacheDir) doesn't have atomicity guarantess
// so we use an in-memory lock to make concurrent writes serial
let lock = null;
// We also make the in-memory cache global so we can update it atomically
// whereas a naive read/write is not atomic
// Since we only ever use the cache variable from a single Node process,
// assigning to it is atomic enough for our needs
let cache = {};
/*::
export type Cache = {
  isCached: (string) => Promise<boolean>,
  invalidate: (string) => void,
  update: (string) => Promise<void>,
  save: () => Promise<void>,
}
export type ChecksumCache = (string) => Promise<Cache>
*/
const checksumCache /*: ChecksumCache */ = async root => {
  const cacheDir = `${root}/third_party/jazelle/temp/cache.json`;
  if (!(await exists(cacheDir))) {
    await spawn('mkdir', ['-p', dirname(cacheDir)]);
  }
  // Sync cache in memory since a read is not atomic
  // Doing this means it's technically possible for a cache update to be
  // saved without calling its instance's save method
  // but since we ideally always want to save as soon as an update happens
  // (but just don't do it to avoid unnecessary save calls due to cost)
  // it doesn't matter if writes happen out-of-band
  // We always save at the end anyways
  cache = {
    ...cache,
    ...JSON.parse(await read(cacheDir, 'utf8').catch(() => '{}')),
  };

  return {
    async isCached(key) {
      const digest = await getHash(key);
      return digest === cache[key];
    },
    invalidate(key) {
      delete cache[key];
    },
    async update(key) {
      cache[key] = await getHash(key);
    },
    async save() {
      // If lock is a promise, another instance is already writing,
      // so we wait for it before writing our version of the data
      // A lock may be re-acquired if three or more instances save at
      // the same time, so we need a while loop to await for every new lock
      while (lock instanceof Promise) await lock;
      try {
        // lock synchronously (i.e. atomically as far as the Node event loop is concerned)
        lock = write(cacheDir, JSON.stringify(cache, null, 2), 'utf8');
        await lock; // wait for the write to finish before unlocking
      } finally {
        // unlock even if write throws
        lock = null;
      }
    },
  };
};

/*::
type GetHash = string => Promise<string>
*/
const getHash /*: GetHash */ = async key => {
  const stats = await lstat(key);
  const cmd = stats.isDirectory()
    ? `tar -c --exclude ${key}/node_modules ${key} | md5sum`
    : `cat ${key} | md5sum`;
  return await exec(cmd);
};

module.exports = {checksumCache, getHash};
