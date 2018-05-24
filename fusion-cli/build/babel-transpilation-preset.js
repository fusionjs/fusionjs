/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/**
 * This babel config is used for transpiling valid spec-compliant ES2017+.
 * This should be universally applied for all code, including node_modules.
 */

module.exports = function buildPreset(
  context /*: any */,
  {targets, modules = false} /*: any */
) {
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
