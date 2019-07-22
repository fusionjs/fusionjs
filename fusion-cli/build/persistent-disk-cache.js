/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { promisify } = require("util");

const makeDir = require("make-dir");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const gunzip = promisify(zlib.gunzip);
const gzip = promisify(zlib.gzip);
const v8 = require("v8");

module.exports = class PersistentDiskCache /*::<T>*/ {
  /*::
  cacheDirectory: string;
  */
  constructor(cacheDirectory /*:string*/) {
    this.cacheDirectory = cacheDirectory;
  }
  async get(cacheKey /*: string*/, thunk /*: () => T */) {
    const filepath = this.getFilePath(this.cacheDirectory, cacheKey);

    try {
      return await read(filepath);
    } catch (err) {
      // Simply ignore cache if read fails
    }
    if (thunk == undefined) return null;

    return thunk();
  }

  async put(cacheKey /*: string*/, cache /*:Object*/) {
    const filepath = this.getFilePath(this.cacheDirectory, cacheKey);

    try {
      await makeDir(this.cacheDirectory);
      write(filepath, cache);
    } catch (err) {
      // If write fails, oh well
    }
  }

  getFilePath(dirname /*: string*/, cacheKey /*: string*/) {
    return path.join(dirname, `${cacheKey}.json.gz`);
  }
};

async function read(path /*: string*/) {
  const data = await readFile(path);
  const content = await gunzip(data);
  return v8.deserialize(content);
}

async function write(path /*: string*/, result) {
  const content = v8.serialize(result);
  const data = await gzip(content);
  return writeFile(path, data);
}
