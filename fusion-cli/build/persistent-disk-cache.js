/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const {promisify} = require('util');

const makeDir = require('make-dir');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const gunzip = promisify(zlib.gunzip);
const gzip = promisify(zlib.gzip);

module.exports = class PersistentDiskCache /*::<T>*/ {
  /*::
  cacheDirectory: string;
  */
  constructor(cacheDirectory /*:string*/) {
    this.cacheDirectory = cacheDirectory;
  }
  async get(cacheKey /*: string*/, thunk /*: () => T */) {
    const filepath = getFilePath(this.cacheDirectory, cacheKey);

    try {
      return await read(filepath);
    } catch (err) {
      // Simply ignore cache if read fails
    }

    const result = thunk();

    try {
      await makeDir(this.cacheDirectory);
      await write(filepath, result);
    } catch (err) {
      // If write fails, oh well
    }

    return result;
  }
};

async function read(path /*: string*/) {
  const data = await readFile(path);
  const content = await gunzip(data);
  return JSON.parse(content);
}

async function write(path /*: string*/, result) {
  const content = JSON.stringify(result);
  const data = await gzip(content);
  return await writeFile(path, data);
}

function getFilePath(dirname, cacheKey) {
  return path.join(dirname, `${cacheKey}.json.gz`);
}
