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

const ConcatenatedModule = require('webpack/lib/optimize/ConcatenatedModule.js');
const ImportDependency = require('webpack/lib/dependencies/ImportDependency');
const ImportDependencyTemplate = require('webpack/lib/dependencies/ImportDependency')
  .Template;

class InstrumentedImportDependency extends ImportDependency {
  constructor(dep, opts, moduleIdent) {
    super(dep.request, dep.originModule, dep.block);
    this.module = dep.module;
    this.loc = dep.loc;
    if (opts.compilation === 'client') {
      this.translationsManifest = opts.i18nManifest;
    }
    /**
     * Production builds may have no id at this point
     * This compilation phase is earlier than moduleIds, so
     *  we must create our own and cache it based on the module identifier
     */
    dep.module.id = createCachedModuleId(moduleIdent);
  }
  getInstrumentation() {
    // client-side, use built-in values
    this.chunkIds = getChunkGroupIds(this.block.chunkGroup);
    this.translationKeys = new Set();
    if (this.translationsManifest) {
      const modules = getChunkGroupModules(this);
      for (const module of modules) {
        if (this.translationsManifest.has(module)) {
          const keys = this.translationsManifest.get(module);
          for (const key of keys) {
            this.translationKeys.add(key);
          }
        }
      }
    }
    return {
      chunkIds: this.chunkIds,
      translationKeys: Array.from(this.translationKeys),
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
      const ids = this.clientChunkIndex.get(getModuleResource(dep.module));
      chunkIds = ids ? Array.from(ids) : [];
    } else {
      // Prevent future developers from creating a broken webpack state
      throw new Error(
        'Dependency is not Instrumented and lacks a clientChunkIndex'
      );
    }
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
                    let moduleId = dep.module.id;
                    if (dep.module.id === null && dep.module.libIdent) {
                      moduleId = dep.module.libIdent({
                        context: compiler.options.context,
                      });
                    }
                    block.dependencies[
                      index
                    ] = new InstrumentedImportDependency(
                      dep,
                      this.opts,
                      moduleId
                    );
                  }
                });
              });
            }
          }
        });
      });
    }
    /**
     * server and client
     * Ensure custom module ids are used instead of hashed module ids
     * Based on https://github.com/gogoair/custom-module-ids-webpack-plugin
     */
    compiler.hooks.compilation.tap(name, (compilation, params) => {
      compilation.hooks.beforeModuleIds.tap(name, modules => {
        for (const module of modules) {
          if (module.id === null && module.libIdent) {
            // Some modules lose their id by this point
            // Reassign the cached module id so it matches the id used in the instrumentation
            const id = module.libIdent({
              context: compiler.options.context,
            });
            const moduleId = getCachedModuleId(id);
            if (moduleId) {
              module.id = moduleId;
            }
          }
        }
      });
    });
  }
}

module.exports = InstrumentedImportDependencyTemplatePlugin;

const customModuleIds = new Map();
let moduleCounter = 0;

/**
 * Create custom module id, cached based on the module identifier
 * id format: `__fusion__0`
 */
function createCachedModuleId(ident) {
  if (/^__fusion__\d+$/.test(ident)) {
    // This is already a cached identifier
    return ident;
  }
  if (customModuleIds.has(ident)) {
    return customModuleIds.get(ident);
  }
  const moduleId = `__fusion__${(moduleCounter++).toString()}`;
  customModuleIds.set(ident, moduleId);
  return moduleId;
}

function getCachedModuleId(ident) {
  return customModuleIds.get(ident);
}

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

function getModuleResource(module) {
  if (module instanceof ConcatenatedModule) {
    return module.rootModule.resource;
  } else {
    return module.resource;
  }
}

function getChunkGroupModules(dep) {
  const modulesSet = new Set();
  if (dep.module && dep.module.dependencies) {
    modulesSet.add(getModuleResource(dep.module));
    dep.module.dependencies.forEach(dependency => {
      if (dependency.module) {
        modulesSet.add(getModuleResource(dependency.module));
      }
    });
  }
  const {chunkGroup} = dep.block;
  if (chunkGroup && Array.isArray(chunkGroup.chunks)) {
    chunkGroup.chunks.forEach(chunk => {
      for (const module of chunk.getModules()) {
        modulesSet.add(getModuleResource(module));
        if (module instanceof ConcatenatedModule) {
          module.buildInfo.fileDependencies.forEach(fileDep => {
            modulesSet.add(fileDep);
          });
        }
      }
    });
  }
  return modulesSet;
}
