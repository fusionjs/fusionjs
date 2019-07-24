/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

/*::
type Target = "node-native" | "node-bundled" | "browser-modern" | "browser-legacy";
type JSXTransformOpts = {
  pragma?: string,
  pragmaFrag?: string,
};
type BabelConfigOpts =
| {|
    specOnly: true,
    target: Target,
    plugins?: Array<any>,
    presets?: Array<any>,
  |}
| {|
    specOnly: false,
    dev: boolean,
    target: Target,
    plugins?: Array<any>,
    presets?: Array<any>,
    jsx?: JSXTransformOpts,
    assumeNoImportSideEffects?: boolean,
    fusionTransforms: boolean
  |};
*/

module.exports = function getBabelConfig(opts /*: BabelConfigOpts */) {
  const {target, plugins, presets} = opts;

  // Shared base env preset options
  let envPresetOpts /*: Object*/ = {
    useBuiltIns: 'entry',
    corejs: '3.0.0',
  };

  // Shared base configuration
  let config = {
    plugins: [
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      [
        require.resolve('@rtsao/plugin-proposal-class-properties'),
        {loose: false},
      ],
      opts.dev &&
        require.resolve('babel-plugin-transform-styletron-display-name'),
    ].filter(Boolean),
    presets: [[require.resolve('@babel/preset-env'), envPresetOpts]],
    babelrc: false,
  };

  if (opts.specOnly === false) {
    let {jsx, assumeNoImportSideEffects, dev, fusionTransforms} = opts;
    if (!jsx) {
      jsx = {};
    }
    config.presets.push([
      require.resolve('@babel/preset-react'),
      {
        pragma: jsx.pragma,
        pragmaFrag: jsx.pragmaFrag,
        development: dev,
      },
    ]);
    config.plugins.unshift(
      require.resolve('@babel/plugin-transform-flow-strip-types')
    );
    if (fusionTransforms) {
      config.presets.push([fusionPreset, {target, assumeNoImportSideEffects}]);
    } else {
      config.plugins.push(require.resolve('./babel-plugins/babel-plugin-gql'));
    }
  }

  if (target === 'node-native') {
    envPresetOpts.modules = 'commonjs';
    envPresetOpts.targets = {
      node: 'current',
    };
    config.plugins.push(require.resolve('babel-plugin-dynamic-import-node'));
  } else if (target === 'node-bundled') {
    envPresetOpts.modules = false;
    envPresetOpts.targets = {
      node: 'current',
    };
  } else if (target === 'browser-modern') {
    envPresetOpts.modules = false;
    envPresetOpts.targets = {
      esmodules: true,
    };
    envPresetOpts.useBuiltIns = 'entry';
  } else if (target === 'browser-legacy') {
    envPresetOpts.modules = false;
    envPresetOpts.targets = {
      ie: 9,
    };
  }

  if (plugins) {
    // Note: babel plugins run first to last, so custom plugins go first
    config.plugins.unshift(...plugins);
  }

  if (presets) {
    // Note: babel presets run last to first, so custom plugins go last
    config.presets.push(...presets);
  }

  return config;
};

/*::
type FusionPresetOpts = {
  target: Target,
  assumeNoImportSideEffects: boolean,
};
*/

/**
 * This is abstracted into preset for the following reasoning:
 * The tree shake plugin needs to run after JSX transform.
 * However, the JSX transform is inside the React preset.
 * Because plugins run before presets, the tree shake plugin
 * must also live in a preset.
 */
function fusionPreset(
  context /*: any */,
  {target, assumeNoImportSideEffects} /*: FusionPresetOpts */
) {
  const targetEnv =
    target === 'node-native' || target === 'node-bundled' ? 'node' : 'browser';

  return {
    plugins: [
      require.resolve('./babel-plugins/babel-plugin-gql'),
      require.resolve('./babel-plugins/babel-plugin-asseturl'),
      require.resolve('./babel-plugins/babel-plugin-pure-create-plugin'),
      require.resolve('./babel-plugins/babel-plugin-sync-chunk-ids'),
      require.resolve('./babel-plugins/babel-plugin-sw'),
      require.resolve('./babel-plugins/babel-plugin-sync-chunk-paths'),
      require.resolve('./babel-plugins/babel-plugin-chunkid'),
      require.resolve('./babel-plugins/babel-plugin-workerurl'),
      [
        require.resolve('babel-plugin-transform-cup-globals'),
        {target: targetEnv},
      ],
      assumeNoImportSideEffects && [
        require.resolve('babel-plugin-transform-prune-unused-imports'),
        {
          falsyExpressions:
            targetEnv === 'node' ? ['__BROWSER__'] : ['__NODE__'],
        },
      ],
    ].filter(Boolean),
  };
}
