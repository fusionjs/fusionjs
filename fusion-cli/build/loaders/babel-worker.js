/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const Worker = require('jest-worker');
const {translationsDiscoveryKey} = require('./loader-context.js');

function webpackLoader(source /*: string */, inputSourceMap /*: Object */) {
  // Make the loader async
  const callback = this.async();

  const worker = new Worker(require.resolve('./babel-loader'));
  worker
    .loader(this, source, inputSourceMap, this[translationsDiscoveryKey])
    .then(([code, map]) => callback(null, code, map), err => callback(err));
}

module.exports = webpackLoader;
