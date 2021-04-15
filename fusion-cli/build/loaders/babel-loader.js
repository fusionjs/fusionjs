/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const path = require('path');

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
    .then(
      ([code, map]) => callback(null, code, map),
      err => callback(err)
    );
}

async function loader(
  source,
  inputSourceMap,
  discoveryState /*: TranslationsDiscoveryContext*/
) {
  const filename = this.resourcePath;
  let loaderOptions = loaderUtils.getOptions(this);
  // Use worker farm if provided, otherwise require the worker code and execute it in the same thread
  const worker = this[workerKey] || require('./babel-worker.js');

  const result = await worker.runTransformation(
    source,
    inputSourceMap,
    filename,
    loaderOptions,
    this.rootContext,
    this.sourceMap
  );

  if (result) {
    const {code, map, metadata} = result;

    if (discoveryState) {
      if (metadata.translationIds) {
        discoveryState.set(filename, new Set(metadata.translationIds));
      } else {
        // Need to update persisted cache when translations keys are no longer used
        if (discoveryState.has(filename)) {
          discoveryState.delete(filename);
        }
      }
    }

    return [code, map];
  }

  // If the file was ignored, pass through the original content.
  return [source, inputSourceMap];
}
