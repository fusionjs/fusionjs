/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const loadFusionRC = require('../load-fusionrc.js');
const getBabelConfig = require('../get-babel-config.js');

const fusionConfig = loadFusionRC(process.cwd());

let customPlugins;
let customPresets;

if (fusionConfig.babel) {
  customPlugins = fusionConfig.babel.plugins;
  customPresets = fusionConfig.babel.presets;
}

const babelConfig = getBabelConfig({
  target: 'node-native',
  specOnly: false,
  plugins: customPlugins,
  presets: customPresets,
  dev: false,
  fusionTransforms: false,
});

const transformer = require('babel-jest').createTransformer(babelConfig);

module.exports = transformer;
