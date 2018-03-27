/* eslint-env node */

/**
 * This babel config is used for fusion-related compilation,
 * including non-standard language features (e.g. React and Flow).
 * This should only be applied when compiling files in src/
 */

module.exports = function buildPreset(
  context,
  {targets, transformGlobals = true}
) {
  const target = targets.hasOwnProperty('node') ? 'node' : 'browser';

  return {
    presets: [require('@babel/preset-react'), require('@babel/preset-flow')],
    plugins: [
      require('@babel/plugin-syntax-object-rest-spread'),
      require('@babel/plugin-syntax-dynamic-import'),
      ...(transformGlobals
        ? [
            [
              require.resolve('babel-plugin-transform-cup-globals'),
              {target: target},
            ],
          ]
        : []),
    ],
  };
};
