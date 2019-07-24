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

const babelConfig = getBabelConfig({
  target: 'node-native',
  specOnly: false,
  plugins: fusionConfig.babel && fusionConfig.babel.plugins,
  presets: fusionConfig.babel && fusionConfig.babel.presets,
  dev: false,
  fusionTransforms: false,
});

const transformer = require('babel-jest').createTransformer(babelConfig);

module.exports = transformer;
