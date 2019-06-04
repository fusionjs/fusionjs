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

class InstrumentedImportDependency extends ImportDependency {
  constructor(dep, opts) {
    super(dep.request, dep.originModule, dep.block);
    this.module = dep.module;
    this.loc = dep.loc;
    if (opts.compilation === 'client') {
      this.translationsManifest = opts.i18nManifest;
    }
  }
  getInstrumentation() {
    // client-side, use built-in values
    this.chunkIds = getChunkGroupIds(this.block.chunkGroup);
    this.translationKeys = [];
    if (this.translationsManifest) {
      const modules = getChunkGroupModules(this);
      for (const module of modules) {
        if (this.translationsManifest.has(module)) {
          const keys = this.translationsManifest.get(module).keys();
          this.translationKeys.push(...keys);
        }
      }
    }
    return {
      chunkIds: this.chunkIds,
      translationKeys: this.translationKeys,
    };
  }
  updateHash(hash) {
    super.updateHash(hash);
    const {translationKeys} = this.getInstrumentation();
    // Invalidate this dependency when the translation keys change
    // Necessary for HMR
    hash.update(JSON.stringify(translationKeys));
  }
}

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
 * Object.defineProperties(import('./foo.js'), {__CHUNK_IDS: [5], __MODULE_ID: "abc", __I18N_KEYS: ['key1']})
 * // Also returns a promise, but with extra non-enumerable properties
 */
InstrumentedImportDependency.Template = class InstrumentedImportDependencyTemplate extends ImportDependencyTemplate {
  constructor(clientChunkIndex) {
    super();
    if (clientChunkIndex) {
      this.clientChunkIndex = clientChunkIndex;
    }
  }
  /**
   * It may be possible to avoid duplicating code by extending `super`, but
   * for now, we'll just override this method entirely with a modified version
   * Based on https://github.com/webpack/webpack/blob/5e38646f589b5b6325556f3127e7b61df33d3cb9/lib/dependencies/ImportDependency.js
   */
  apply(dep /*: any */, source /*: any */, runtime /*: any */) {
    const depBlock = dep.block;
    let chunkIds = [];
    let translationKeys = [];
    if (dep instanceof InstrumentedImportDependency) {
      const instrumentation = dep.getInstrumentation();
      chunkIds = instrumentation.chunkIds;
      translationKeys = instrumentation.translationKeys;
    } else if (this.clientChunkIndex) {
      // Template invoked without InstrumentedImportDependency
      // server-side, use values from client bundle
      let ids = this.clientChunkIndex.get(
        (dep.module && dep.module.resource) || dep.originModule.resource
      );
      chunkIds = ids ? Array.from(ids) : [];
    } else {
      chunkIds = getChunkGroupIds(dep.block.chunkGroup);
    }

    // This is a hack. Some production builds had undefined for the module.id
    // which broke the build.
    dep.module.id =
      dep.module.id || (dep.module.identifier && dep.module.identifier());

    const content = runtime.moduleNamespacePromise({
      block: dep.block,
      module: dep.module,
      request: dep.request,
      strict: dep.originModule.buildMeta.strictHarmonyModule,
      message: 'import()',
    });

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
};

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
    if (this.opts.compilation === 'server') {
      const {clientChunkMetadata} = this.opts;
      compiler.hooks.make.tapAsync(name, (compilation, done) => {
        clientChunkMetadata.result.then(metadata => {
          compilation.dependencyTemplates.set(
            ImportDependency,
            new InstrumentedImportDependency.Template(metadata.fileManifest)
          );
          done();
        });
      });
    }
    if (this.opts.compilation === 'client') {
      // Add a new template and factory for IntrumentedImportDependency
      compiler.hooks.compilation.tap(name, (compilation, params) => {
        compilation.dependencyFactories.set(
          InstrumentedImportDependency,
          params.normalModuleFactory
        );
        compilation.dependencyTemplates.set(
          InstrumentedImportDependency,
          new InstrumentedImportDependency.Template()
        );
        compilation.hooks.afterOptimizeDependencies.tap(name, modules => {
          // Replace ImportDependency with our Instrumented dependency
          for (const module of modules) {
            if (module.blocks) {
              module.blocks.forEach(block => {
                block.dependencies.forEach((dep, index) => {
                  if (dep instanceof ImportDependency) {
                    block.dependencies[
                      index
                    ] = new InstrumentedImportDependency(dep, this.opts);
                  }
                });
              });
            }
          }
        });
      });
    }
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
    modulesSet.add(dep.module.userRequest);
    dep.module.dependencies.forEach(dependency => {
      if (dependency.module) {
        modulesSet.add(dependency.module.userRequest);
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
