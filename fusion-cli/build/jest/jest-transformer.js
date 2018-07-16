/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// Clear require cache before each run to reset file exports between environment runs.
// Currently the transformer seems like the most robust place to clear cache.
const clearModule = require('clear-module');

clearModule.all();

const loadFusionRC = require('../load-fusionrc.js');

const babelConfig = require('../babel-preset.js')(null, {
  targets: {
    node: 'current',
  },
  modules: 'commonjs',
  transformGlobals: false,
});

const fusionConfig = loadFusionRC(process.cwd());

if (!babelConfig.plugins) {
  babelConfig.plugins = [];
}

babelConfig.plugins.push(require.resolve('babel-plugin-dynamic-import-node'));

if (fusionConfig.babel && fusionConfig.babel.plugins) {
  // Run user-defined plugins first
  babelConfig.plugins = fusionConfig.babel.plugins.concat(
    ...babelConfig.plugins
  );
}

const transformer = require('babel-jest').createTransformer(babelConfig);

module.exports = transformer;
