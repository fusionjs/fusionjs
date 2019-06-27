/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const Worker = require('jest-worker').default;

function webpackLoader(source /*: string */, inputSourceMap /*: Object */) {
  const worker = new Worker(require.resolve('./babel-loader.js'), {
    exposedMethods: ['webpackLoader'],
  });
  worker.webpackLoader(source, inputSourceMap, this.async());
}

module.exports = webpackLoader;
