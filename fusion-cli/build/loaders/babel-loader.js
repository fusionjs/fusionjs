/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const crypto = require('crypto');

const babel = require('@babel/core');
const loaderUtils = require('loader-utils');

const {translationsDiscoveryKey, workerKey} = require('./loader-context.js');

/*::
import type {TranslationsDiscoveryContext} from "./loader-context.js";
*/

module.exports = webpackLoader;

const {version: fusionCLIVersion} = require('../../package.json');

function webpackLoader(source /*: string */, inputSourceMap /*: Object */) {
  // Make the loader async
  const callback = this.async();
  loader
    .call(this, source, inputSourceMap, this[translationsDiscoveryKey])
    .then(([code, map]) => callback(null, code, map), err => callback(err));
}

async function loader(
  source,
  inputSourceMap,
  discoveryState /*: TranslationsDiscoveryContext*/
) {
  const filename = this.resourcePath;
  let loaderOptions = loaderUtils.getOptions(this);
  const cacheKey = crypto
    // non-cryptographic purposes
    // md4 is the fastest built-in algorithm
    .createHash('md4')
    // Changing any of the following values should yield a new cache key,
    // thus our hash should take into account them all
    .update(source)
    .update(filename) // Analysis/transforms might depend on filenames
    .update(JSON.stringify(loaderOptions))
    .update(babel.version)
    .update(fusionCLIVersion)
    .digest('hex');

  const worker = this[workerKey];

  const result = await worker.runTransformation(
    source,
    inputSourceMap,
    cacheKey,
    filename,
    loaderOptions,
    this.rootContext,
    this.sourceMap
  );

  if (result) {
    // $FlowFixMe
    const {code, map, metadata} = result;

    if (discoveryState && metadata.translationIds) {
      discoveryState.set(filename, new Set(metadata.translationIds));
    }

    return [code, map];
  }

  // If the file was ignored, pass through the original content.
  return [source, inputSourceMap];
}
