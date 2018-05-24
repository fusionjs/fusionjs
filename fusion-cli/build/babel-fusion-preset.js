/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/**
 * This babel config is used for fusion-related compilation,
 * including non-standard language features (e.g. React and Flow).
 * This should only be applied when compiling files in src/
 */

module.exports = function buildPreset(
  context /*: any */,
  {targets, transformGlobals = true} /*: any */
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
