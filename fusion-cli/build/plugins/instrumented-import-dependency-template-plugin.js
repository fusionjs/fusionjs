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

type InstrumentationTemplateOpts = ServerTemplateOpts | ClientTemplateOpts;

type ClientChunkIndex = $PropertyType<ClientChunkMetadata, 'fileManifest'>;

type ServerTemplateOpts = {|
  clientChunkIndex: ClientChunkIndex
|}

type ClientTemplateOpts = {|
  i18nManifest: TranslationsManifest
|}

*/

const ConcatenatedModule = require('webpack/lib/optimize/ConcatenatedModule.js');
const ImportDependency = require('webpack/lib/dependencies/ImportDependency');
const ImportDependencyTemplate = require('webpack/lib/dependencies/ImportDependency')
  .Template;

const isInstrumentedSymbolClient = Symbol('InstrumentedImportDependencyClient');
const isInstrumentedSymbolServer = Symbol('InstrumentedImportDependencyServer');

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
class InstrumentedImportDependencyTemplate extends ImportDependencyTemplate {
  /*:: clientChunkIndex: ClientChunkIndex */
  /*:: i18nManifest: TranslationsManifest */

  constructor(opts /*: InstrumentationTemplateOpts */) {
    super();

    if (opts.clientChunkIndex) {
      this.clientChunkIndex = opts.clientChunkIndex;
    }

    if (opts.i18nManifest) {
      this.i18nManifest = opts.i18nManifest;
    }
  }
  /**
   * It may be possible to avoid duplicating code by extending `super`, but
   * for now, we'll just override this method entirely with a modified version
   * Based on https://github.com/webpack/webpack/blob/e1a405e3c248b142894568163b331761e737d6ea/lib/dependencies/ImportDependency.js
   */
  apply(dep /*: any */, source /*: any */, { runtimeTemplate, module, moduleGraph, chunkGraph, runtimeRequirements }) {
    const block = moduleGraph.getParentBlock(dep);
    const depModule = moduleGraph.getModule(dep);

    let translationKeys = [];
    let chunkIds = [];
    if (dep[isInstrumentedSymbolClient]) {
      translationKeys = getTranslationKeys(chunkGraph, moduleGraph, this.i18nManifest, dep);
      chunkIds = getChunkGroupIds(chunkGraph.getBlockChunkGroup(block));
    } else if (dep[isInstrumentedSymbolServer]) {
      // Template invoked without InstrumentedImportDependency
      // server-side, use values from client bundle
      chunkIds = getModuleClientChunkIds(this.clientChunkIndex, depModule);
    } else {
      // Prevent future developers from creating a broken webpack state
      throw new Error(
        'Dependency is not instrumented'
      );
    }
    const content = runtimeTemplate.moduleNamespacePromise({
      chunkGraph,
      block,
      module: depModule,
      request: dep.request,
      strict: module.buildMeta.strictHarmonyModule,
      message: 'import()',
      runtimeRequirements
    });
    // Add the following properties to the promise returned by import()
    // - `__CHUNK_IDS`: the webpack chunk ids for the dynamic import
    // - `__MODULE_ID`: the webpack module id of the dynamically imported module. Equivalent to require.resolveWeak(path)
    // - `__I18N_KEYS`: the translation keys used in the client chunk group for this import()
    const customContent = chunkIds
      ? `Object.defineProperties(${content}, {
        "__CHUNK_IDS": {value:${JSON.stringify(chunkIds)}},
        "__MODULE_ID": {value:${JSON.stringify(chunkGraph.getModuleId(depModule))}},
        "__I18N_KEYS": {value:${JSON.stringify(translationKeys)}}
        })`
      : content;
    // replace with `customContent` instead of `content`
    source.replace(dep.range[0], dep.range[1] - 1, customContent);
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

      let clientChunkIndex;
      compiler.hooks.make.tapAsync(name, (compilation, done) => {
        clientChunkMetadata.result.then(metadata => {
          clientChunkIndex = metadata.fileManifest;

          compilation.dependencyTemplates.set(
            ImportDependency,
            new InstrumentedImportDependencyTemplate({
              clientChunkIndex
            })
          );
          done();
        });
      });

      compiler.hooks.compilation.tap(name, (compilation, params) => {
        compilation.hooks.afterOptimizeDependencies.tap(name, modules => {
          // Instrument ImportDependency
          for (const module of modules) {
            if (module.blocks) {
              module.blocks.forEach(block => {
                block.dependencies.forEach((dep, index) => {
                  if (dep instanceof ImportDependency && !dep[isInstrumentedSymbolServer]) {
                    const depModule = compilation.moduleGraph.getModule(dep);

                    const originalUpdateHash = dep.updateHash;
                    dep.updateHash = function (...args) {
                      originalUpdateHash.apply(this, args);

                      const [hash] = args;
                      const chunkIds = getModuleClientChunkIds(clientChunkIndex, depModule);
                      // Invalidate this dependency when the client chunk ids change
                      // Necessary for HMR, and to invalidate build cache
                      hash.update(chunkIds.join(','));
                    }

                    dep[isInstrumentedSymbolServer] = true;
                  }
                });
              });
            }
          }
        });
      });
    }
    if (this.opts.compilation === 'client') {
      const i18nManifest = this.opts.i18nManifest;

      // Override ImportDependency.Template
      compiler.hooks.make.tap(name, compilation => {
        compilation.dependencyTemplates.set(
          ImportDependency,
          new InstrumentedImportDependencyTemplate({
            i18nManifest
          })
        );
      });

      compiler.hooks.compilation.tap(name, (compilation, params) => {
        compilation.hooks.afterOptimizeDependencies.tap(name, modules => {
          // Instrument ImportDependency
          for (const module of modules) {
            if (module.blocks) {
              module.blocks.forEach(block => {
                block.dependencies.forEach((dep, index) => {
                  if (dep instanceof ImportDependency && !dep[isInstrumentedSymbolClient]) {
                    const depModule = compilation.moduleGraph.getModule(dep);
                    const depModuleId = compilation.chunkGraph.getModuleId(depModule);
                    if (depModuleId === null && depModule.libIdent) {
                      const moduleId = depModule.libIdent({
                        context: compiler.options.context,
                      });
                      compilation.chunkGraph.setModuleId(depModule, createCachedModuleId(moduleId));
                    }

                    const originalUpdateHash = dep.updateHash;
                    dep.updateHash = function (...args) {
                      originalUpdateHash.apply(this, args);

                      const [hash] = args;
                      const translationKeys = getTranslationKeys(compilation.chunkGraph, compilation.moduleGraph, i18nManifest, dep);
                      // Invalidate this dependency when the translation keys change
                      // Necessary for HMR, and to invalidate build cache
                      hash.update(translationKeys.join(','));
                    }

                    dep[isInstrumentedSymbolClient] = true;
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
          const moduleId = compilation.chunkGraph.getModuleId(module);
          if (moduleId === null && module.libIdent) {
            // Some modules lose their id by this point
            // Reassign the cached module id so it matches the id used in the instrumentation
            const id = module.libIdent({
              context: compiler.options.context,
            });
            const cachedModuleId = getCachedModuleId(id);
            if (cachedModuleId) {
              compilation.chunkGraph.setModuleId(module, cachedModuleId);
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

function getTranslationKeys(chunkGraph, moduleGraph, i18nManifest, dep) {
  const translationKeys = new Set();
  if (i18nManifest) {
    const modules = getChunkGroupModules(chunkGraph, moduleGraph, dep);
    for (const module of modules) {
      if (i18nManifest.has(module)) {
        const keys = i18nManifest.get(module);
        if (keys) {
          for (const key of keys) {
            translationKeys.add(key);
          }
        }
      }
    }
  }

  return Array.from(translationKeys).sort();
}

function getModuleClientChunkIds(clientChunkIndex, module) {
  const clientChunkIds = clientChunkIndex.get(getModuleResource(module));

  if (clientChunkIds) {
    return Array.from(clientChunkIds).sort();
  }

  return [];
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

function getChunkGroupModules(chunkGraph, moduleGraph, dep) {
  const modulesSet = new Set();
  const depModule = moduleGraph.getModule(dep);
  if (depModule && depModule.dependencies) {
    modulesSet.add(getModuleResource(depModule));
    depModule.dependencies.forEach(dependency => {
      const dependencyModule = moduleGraph.getModule(dependency);
      if (dependencyModule) {
        modulesSet.add(getModuleResource(dependencyModule));
      }
    });
  }
  const chunkGroup = chunkGraph.getBlockChunkGroup(moduleGraph.getParentBlock(dep));
  if (chunkGroup && Array.isArray(chunkGroup.chunks)) {
    chunkGroup.chunks.forEach(chunk => {
      for (const module of chunkGraph.getChunkModulesIterable(chunk)) {
        modulesSet.add(getModuleResource(module));
        if (module instanceof ConcatenatedModule) {
          module.modules.forEach(module => {
            modulesSet.add(getModuleResource(module));
          });
        }
      }
    });
  }
  return modulesSet;
}
