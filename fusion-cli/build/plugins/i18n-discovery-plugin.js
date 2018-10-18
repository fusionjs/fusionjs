/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {translationsDiscoveryKey} = require('../loaders/loader-context.js');

/*::
import type {TranslationsManifestState, TranslationsManifest} from "../types.js";
*/

class I18nDiscoveryPlugin {
  /*::
  manifest: TranslationsManifestState;
  discoveryState: TranslationsManifest;
  */
  constructor(manifest /*: TranslationsManifestState*/) {
    this.manifest = manifest;
    this.discoveryState = new Map();
  }
  apply(compiler /*: any */) {
    const name = this.constructor.name;
    // "thisCompilation" is not run in child compilations
    compiler.hooks.thisCompilation.tap(name, compilation => {
      compilation.hooks.normalModuleLoader.tap(name, (context, module) => {
        context[translationsDiscoveryKey] = this.discoveryState;
      });
    });
    compiler.hooks.done.tap(name, () => {
      this.manifest.resolve(this.discoveryState);
    });
    compiler.hooks.invalid.tap(name, filename => {
      this.manifest.reset();
      this.discoveryState.delete(filename);
    });
  }
}

module.exports = I18nDiscoveryPlugin;
