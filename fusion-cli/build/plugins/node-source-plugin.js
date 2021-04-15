/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const AliasPlugin = require('enhanced-resolve/lib/AliasPlugin');
const nodeLibsBrowser = require('node-libs-browser');

// @see: https://github.com/webpack/webpack/blob/v4.46.0/lib/node/NodeSourcePlugin.js#L21-L36
function getPathToModule(module, type) {
  if (type === true || (typeof type === 'undefined' && nodeLibsBrowser[module])) {
    if (!nodeLibsBrowser[module]) {
      throw new Error(
        `No browser version for node.js core module '${module}' available`
      );
    }

    return nodeLibsBrowser[module];
  } else if (type === 'mock') {
    return require.resolve(`node-libs-browser/mock/${module}`);
  } else if (type === 'empty') {
    return false;
  } else {
    return module;
  }
}

// NOTE: Breaking change in webpack v5
// Need to provide same API to source node modules in client bundles
// @see: https://github.com/webpack/webpack/blob/v4.46.0/lib/node/NodeSourcePlugin.js
class NodeSourcePlugin {
  constructor(nodeBuiltins) {
    this.nodeBuiltins = nodeBuiltins;
  }

  apply(compiler) {
    const nodeLibsAliases = Array.from(new Set([
        ...Object.keys(nodeLibsBrowser),
        'http2',
      ]))
      .filter(name => this.nodeBuiltins[name] !== false)
      .map(name => ({
        name,
        onlyModule: true,
        alias: getPathToModule(name, this.nodeBuiltins[name])
      }));

    // This ensures that this alias will apply to any request after it's attempted to resolve using
    // regular `resolve.alias` and `resolve.aliasFields`. This way we still respect the `browser`
    // field defined in package.json (e.g. `browser: { path: false })`, and is the only reason we
    // do it this way, as opposed to using the `resolve.fallback`, which runs after normal module
    // resolution in which case it would prioritize node_module over browser version.
    // @see: https://github.com/webpack/enhanced-resolve/blob/v5.7.0/lib/ResolverFactory.js#L334-L349
    compiler.hooks.afterResolvers.tap('NodeSourcePlugin', compiler => {
      compiler.resolverFactory.hooks.resolver
        .for('normal')
        .tap('NodeSourcePlugin', resolver => {
          new AliasPlugin(
            'normal-resolve',
            nodeLibsAliases,
            'internal-resolve'
          ).apply(resolver);
        });
    });
  }
}

module.exports = NodeSourcePlugin;