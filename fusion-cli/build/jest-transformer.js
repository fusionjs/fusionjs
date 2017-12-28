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
babelConfig.plugins.push(require.resolve('babel-plugin-dynamic-import-node'));

if (fusionConfig.babel && fusionConfig.babel.plugins) {
  babelConfig.plugins = babelConfig.plugins.concat(
    ...fusionConfig.babel.plugins
  );
}

const transformer = require('babel-jest').createTransformer(babelConfig);

const originalProcessFn = transformer.process;

transformer.process = function(src, filename, config, transformOptions) {
  return originalProcessFn.call(
    transformer,
    src,
    filename,
    config,
    transformOptions
  );
};

module.exports = transformer;
