/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*::
import type {
  ClientChunkMetadataState,
  ClientChunkMetadata,
  TranslationsManifest,
} from "../types.js";

type InstrumentationPluginOpts =
  | ClientPluginOpts
  | ServerPluginOpts;

type ServerPluginOpts = {
  compilation: "server",
  clientChunkMetadata: ClientChunkMetadataState
};

type ClientPluginOpts = {
  compilation: "client",
  i18nManifest: TranslationsManifest
};
*/

const ImportDependency = require('webpack/lib/dependencies/ImportDependency');
const ImportDependencyTemplate = require('webpack/lib/dependencies/ImportDependency')
  .Template;

/**
 * We create an extension to the original ImportDependency template
 * that adds extra properties to the promise returned by import()
 * for its corresponding chunkId and module id.
 *
 * At a high level, if module `foo.js` had module id "abc" and was in chunk with id 5, we turn:
 *
 * import('./foo.js')
 * // Returns a promise
 *
 * into:
 *
 * Object.defineProperties(import('./foo.js'), {__CHUNK_IDS: [5], __MODULE_ID: "abc"})
 * // Also returns a promise, but with extra non-enumerable properties
 */

class InstrumentedImportDependencyTemplate extends ImportDependencyTemplate {
  /*:: clientChunkIndex: ?$PropertyType<ClientChunkMetadata, "fileManifest">; */
  /*:: manifest: ?TranslationsManifest; */

  constructor(
    {
      clientChunkMetadata,
      translationsManifest,
    } /*: {clientChunkMetadata?: ClientChunkMetadata, translationsManifest?: TranslationsManifest}*/
  ) {
    super();
    this.translationsManifest = translationsManifest;
    if (clientChunkMetadata) {
      this.clientChunkIndex = clientChunkMetadata.fileManifest;
    }
  }
  /**
   * It may be possible to avoid duplicating code by extending `super`, but
   * for now, we'll just override this method entirely with a modified version
   * Based on https://github.com/webpack/webpack/blob/5e38646f589b5b6325556f3127e7b61df33d3cb9/lib/dependencies/ImportDependency.js
   */
  apply(dep /*: any */, source /*: any */, runtime /*: any */) {
    const depBlock = dep.block;
    const content = runtime.moduleNamespacePromise({
      block: dep.block,
      module: dep.module,
      request: dep.request,
      strict: dep.originModule.buildMeta.strictHarmonyModule,
      message: 'import()',
    });

    let chunkIds;

    if (this.clientChunkIndex) {
      // server-side, use values from client bundle
      let ids = this.clientChunkIndex.get(
        (dep.module && dep.module.resource) || dep.originModule.resource
      );
      chunkIds = ids ? Array.from(ids) : [];
    } else {
      // client-side, use built-in values
      chunkIds = getChunkGroupIds(depBlock.chunkGroup);
    }

    let translationKeys = [];
    if (this.translationsManifest) {
      const modules = getChunkGroupModules(dep);
      for (const module of modules) {
        if (this.translationsManifest.has(module)) {
          const keys = this.translationsManifest.get(module).keys();
          translationKeys.push(...keys);
        }
      }
    }

    // Add the following properties to the promise returned by import()
    // - `__CHUNK_IDS`: the webpack chunk ids for the dynamic import
    // - `__MODULE_ID`: the webpack module id of the dynamically imported module. Equivalent to require.resolveWeak(path)
    // - `__I18N_KEYS`: the translation keys used in the client chunk group for this import()
    const customContent = chunkIds
      ? `Object.defineProperties(${content}, {
        "__CHUNK_IDS": {value:${JSON.stringify(chunkIds)}},
        "__MODULE_ID": {value:${JSON.stringify(dep.module.id)}},
        "__I18N_KEYS": {value:${JSON.stringify(translationKeys)}}
        })`
      : content;

    // replace with `customContent` instead of `content`
    source.replace(depBlock.range[0], depBlock.range[1] - 1, customContent);
  }
}

/**
 * Webpack plugin to replace standard ImportDependencyTemplate with custom one
 * See InstrumentedImportDependencyTemplate for more info
 */

class InstrumentedImportDependencyTemplatePlugin {
  /*:: opts: InstrumentationPluginOpts;*/

  constructor(opts /*: InstrumentationPluginOpts*/) {
    this.opts = opts;
  }

  apply(compiler /*: any */) {
    const name = this.constructor.name;
    /**
     * The standard plugin is added on `compile`,
     * which sets the default value for `ImportDependency` in  the `dependencyTemplates` map.
     * `make` is the subsequent lifeycle method, so we can override this value here.
     */
    compiler.hooks.make.tapAsync(name, (compilation, done) => {
      if (this.opts.compilation === 'server') {
        // server
        this.opts.clientChunkMetadata.result.then(chunkIndex => {
          compilation.dependencyTemplates.set(
            ImportDependency,
            new InstrumentedImportDependencyTemplate({
              clientChunkMetadata: chunkIndex,
            })
          );
          done();
        });
      } else if (this.opts.compilation === 'client') {
        // client
        compilation.dependencyTemplates.set(
          ImportDependency,
          new InstrumentedImportDependencyTemplate({
            translationsManifest: this.opts.i18nManifest,
          })
        );
        done();
      } else {
        throw new Error(
          'InstrumentationImportDependencyPlugin called without clientChunkMetadata or i18nManifest'
        );
      }
    });
  }
}

module.exports = InstrumentedImportDependencyTemplatePlugin;

/**
 * Adapted from
 * https://github.com/webpack/webpack/blob/5e38646f589b5b6325556f3127e7b61df33d3cb9/lib/dependencies/DepBlockHelpers.js
 */
function getChunkGroupIds(chunkGroup) {
  if (chunkGroup && !chunkGroup.isInitial()) {
    if (Array.isArray(chunkGroup.chunks)) {
      return chunkGroup.chunks.map(c => c.id);
    }
    return [chunkGroup.id];
  }
}

function getChunkGroupModules(dep) {
  const modulesSet = new Set();
  // For ConcatenatedModules in production build
  if (dep.module && dep.module.dependencies) {
    dep.module.dependencies.forEach(dependency => {
      if (dependency.originModule) {
        modulesSet.add(dependency.originModule.userRequest);
      }
    });
  }
  // For NormalModules
  dep.block.chunkGroup.chunks.forEach(chunk => {
    for (const module of chunk._modules) {
      modulesSet.add(module.resource);
    }
  });
  return modulesSet;
}
