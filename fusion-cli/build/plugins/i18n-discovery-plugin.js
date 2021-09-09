/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*::
import type {TranslationsManifestState, TranslationsManifest} from "../types.js";

interface I18nManifestCache {
  storePromise: (TranslationsManifest) => Promise<void>,
  getPromise: () => Promise<TranslationsManifest | void>,
}
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

    const manifest = this.manifest;
    function addModuleTranslationKeys(module) {
      if (
        module.resource &&
        module.buildMeta.fusionTranslationIds &&
        module.buildMeta.fusionTranslationIds.size > 0
      ) {
        manifest.set(module.resource, module.buildMeta.fusionTranslationIds);
      }
    }

    compiler.hooks.compilation.tap(name, (compilation) => {
      // NOTE: This hook will execute twice when legacy bundle is enabled,
      // in which case it should not cause any conflicts, considering that
      // same i18n keys should be discovered in both cases.
      compilation.hooks.afterOptimizeChunkModules.tap(
        name,
        (chunks, modules) => {
          for (const chunk of chunks) {
            for (const module of compilation.chunkGraph.getChunkModulesIterable(
              chunk
            )) {
              if (module.resource) {
                // instanceof NormalModule
                addModuleTranslationKeys(module);
              } else if (module.modules) {
                // instanceof ConcatenatedModule
                module.modules.forEach((m) => {
                  addModuleTranslationKeys(m);
                });
              }
            }
          }
        }
      );
    });

    compiler.hooks.done.tap(name, () => {
      this.manifestState.resolve(this.manifest);
    });
    compiler.hooks.invalid.tap(name, () => {
      this.manifest.clear();
      this.manifestState.reset();
    });
  }
}

module.exports = I18nDiscoveryPlugin;
