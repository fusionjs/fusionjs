/* eslint-env node */

const babelConfig = require('./babel-preset.js')(null, {
  targets: {
    node: 'current',
  },
  modules: 'commonjs',
  transformGlobals: false,
});

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
