/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const webpack = require('webpack');
const {translationsDiscoveryKey} = require('../loaders/loader-context.js');

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
    // "thisCompilation" is not run in child compilations
    compiler.hooks.thisCompilation.tap(name, compilation => {
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap(name, (context, module) => {
        context[translationsDiscoveryKey] = this.manifest;
      });
    });

    const manifestCache/*: I18nManifestCache*/ = compiler
      .getCache(name)
      .getItemCache('manifest', null);

    let cachedManifest/*: TranslationsManifest | void*/;
    let isCacheRestored = false;
    compiler.hooks.beforeCompile.tapPromise(name, async () => {
      // This same hook triggers for child compilation, but we
      // need to restore the cached manfiest only once on each run
      if (isCacheRestored) {
        return;
      }

      cachedManifest = await manifestCache.getPromise();
      if (cachedManifest) {
        // i18n manifest might be stored in cache by reference from previous compilation,
        // in which case we don't need to copy its values as it's pointing to the same object
        if (cachedManifest !== this.manifest) {
          for (const [filename, keys] of cachedManifest) {
            this.manifest.set(filename, keys);
          }
        }
      }

      isCacheRestored = true;
    });
    compiler.hooks.afterCompile.tapPromise(name, async () => {
      if (!isCacheRestored) {
        return;
      }

      if (!cachedManifest || shouldWriteManifestToCache(this.manifest, cachedManifest)) {
        await manifestCache.storePromise(this.manifest);
      }

      isCacheRestored = false;
    });

    compiler.hooks.done.tap(name, () => {
      this.manifestState.resolve(this.manifest);
    });
    compiler.hooks.invalid.tap(name, () => {
      this.manifestState.reset();
    });
  }
}

function shouldWriteManifestToCache(manifest/*: TranslationsManifest*/, cachedManifest/*: TranslationsManifest*/)/*: boolean*/ {
  if (manifest !== cachedManifest) {
    if (manifest.size !== cachedManifest.size) {
      return true;
    }

    for (const [file, translationKeys] of manifest) {
      if (cachedManifest.has(file)) {
        const cachedTranslationKeys = cachedManifest.get(file);

        if (cachedTranslationKeys) {
          if (translationKeys.size !== cachedTranslationKeys.size) {
            return true;
          }

          for (const translationKey of translationKeys) {
            if (!cachedTranslationKeys.has(translationKey)) {
              return true;
            }
          }
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  return false;
}

module.exports = I18nDiscoveryPlugin;
