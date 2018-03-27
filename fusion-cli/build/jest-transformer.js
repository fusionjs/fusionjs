/* eslint-env node */

const loadFusionRC = require('./load-fusionrc.js');

const babelConfig = require('./babel-preset.js')(null, {
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
  babelConfig.plugins = babelConfig.plugins.concat(
    ...fusionConfig.babel.plugins
  );
}

const transformer = require('babel-jest').createTransformer(babelConfig);

module.exports = transformer;
