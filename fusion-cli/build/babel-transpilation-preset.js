/* eslint-env node */

/**
 * This babel config is used for transpiling valid spec-compliant ES2017+.
 * This should be universally applied for all code, including node_modules.
 */

module.exports = function buildPreset(context, {targets, modules = false}) {
  const target = targets.hasOwnProperty('node') ? 'node' : 'browser';

  return {
    presets: [
      [
        require('@babel/preset-env'),
        {
          targets: targets,
          modules: modules,
          exclude: ['transform-regenerator', 'transform-async-to-generator'],
        },
      ],
      require('@babel/preset-react'),
      require('@babel/preset-flow'),
    ],
    plugins: [
      require('@babel/plugin-syntax-dynamic-import'),
      require('@babel/plugin-proposal-async-generator-functions'),
      require('@babel/plugin-proposal-class-properties'),
      [
        require('@babel/plugin-proposal-object-rest-spread'),
        {
          useBuiltIns: true,
        },
      ],
      ...(target === 'browser'
        ? [
            [
              require.resolve('fast-async'),
              {
                spec: true,
              },
            ],
          ]
        : []),
    ],
  };
};
