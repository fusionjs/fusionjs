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
  manifestState: TranslationsManifestState;
  manifest: TranslationsManifest;
  */
  constructor(
    manifestState /*: TranslationsManifestState*/,
    manifest /*: TranslationsManifest*/
  ) {
    this.manifestState = manifestState;
    this.manifest = manifest;
  }
  apply(compiler /*: any */) {
    const name = this.constructor.name;
    // "thisCompilation" is not run in child compilations
    compiler.hooks.thisCompilation.tap(name, compilation => {
      compilation.hooks.normalModuleLoader.tap(name, (context, module) => {
        context[translationsDiscoveryKey] = this.manifest;
      });
    });
    compiler.hooks.done.tap(name, () => {
      this.manifestState.resolve(this.manifest);
    });
    compiler.hooks.invalid.tap(name, filename => {
      this.manifestState.reset();
      this.manifest.delete(filename);
    });
  }
}

module.exports = I18nDiscoveryPlugin;
