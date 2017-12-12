/* eslint-env node */

const transformer = require('babel-jest').createTransformer({
  presets: ['babel-preset-flow', 'babel-preset-react'].map(require.resolve),
});

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
