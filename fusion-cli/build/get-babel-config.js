/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

/*::
type Runtime = "node-native" | "node-bundled" | "browser-modern" | "browser-legacy";
type JSXTransformOpts = {
  pragma?: string,
  pragmaFrag?: string,
};
type BabelConfigOpts =
| {|
    specOnly: true,
    runtime: Runtime,
    plugins?: Array<any>,
    presets?: Array<any>,
  |}
| {|
    specOnly: false,
    dev: boolean,
    runtime: Runtime,
    plugins?: Array<any>,
    presets?: Array<any>,
    jsx?: JSXTransformOpts,
    assumeNoImportSideEffects?: boolean,
    fusionTransforms: boolean
  |};
*/

module.exports = function getBabelConfig(opts /*: BabelConfigOpts */) {
  const {runtime, plugins, presets} = opts;

  // Shared base env preset options
  let envPresetOpts /*: Object*/ = {
    useBuiltIns: 'entry',
  };

  // Shared base configuration
  let config = {
    plugins: [
      require('@babel/plugin-syntax-dynamic-import'),
      [require('@babel/plugin-proposal-class-properties'), {loose: false}],
    ],
    presets: [[require('@babel/preset-env'), envPresetOpts]],
    babelrc: false,
  };

  if (opts.specOnly === false) {
    let {jsx, assumeNoImportSideEffects, dev, fusionTransforms} = opts;
    if (!jsx) {
      jsx = {};
    }
    config.presets.push([
      require('@babel/preset-react'),
      {
        pragma: jsx.pragma,
        pragmaFrag: jsx.pragmaFrag,
        development: dev,
      },
    ]);
    config.presets.push(require('@babel/preset-flow'));
    if (fusionTransforms) {
      config.presets.push([fusionPreset, {runtime, assumeNoImportSideEffects}]);
    }
  }

  if (runtime === 'node-native') {
    envPresetOpts.modules = 'commonjs';
    envPresetOpts.targets = {
      node: 'current',
    };
    config.plugins.push(require('babel-plugin-dynamic-import-node'));
  } else if (runtime === 'node-bundled') {
    envPresetOpts.modules = false;
    envPresetOpts.targets = {
      node: 'current',
    };
  } else if (runtime === 'browser-modern') {
    envPresetOpts.modules = false;
    envPresetOpts.targets = {
      esmodules: true,
    };
  } else if (runtime === 'browser-legacy') {
    envPresetOpts.modules = false;
    envPresetOpts.targets = {
      ie: 9,
    };
    envPresetOpts.exclude = [
      'transform-regenerator',
      'transform-async-to-generator',
    ];
    config.plugins.push([require('fast-async'), {spec: true}]);
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
  runtime: Runtime,
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
  {runtime, assumeNoImportSideEffects} /*: FusionPresetOpts */
) {
  const target =
    runtime === 'node-native' || runtime === 'node-bundled'
      ? 'node'
      : 'browser';

  return {
    plugins: [
      require('./babel-plugins/babel-plugin-asseturl'),
      require('./babel-plugins/babel-plugin-pure-create-plugin'),
      require('./babel-plugins/babel-plugin-sync-chunk-ids'),
      require('./babel-plugins/babel-plugin-sync-chunk-paths'),
      require('./babel-plugins/babel-plugin-chunkid'),
      [require('babel-plugin-transform-cup-globals'), {target}],
      assumeNoImportSideEffects && [
        require('./babel-plugins/babel-plugin-transform-tree-shake'),
        {target},
      ],
    ].filter(Boolean),
  };
}
