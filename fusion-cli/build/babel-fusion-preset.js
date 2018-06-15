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

// Needs to be a preset, because tree shaking must run after JSX plugin (in React preset)
function globalsPreset(
  context /*: any */,
  {target, transformGlobals, assumeNoImportSideEffects} /*: any */
) {
  return {
    plugins: [
      ...(transformGlobals
        ? [
            [require.resolve('babel-plugin-transform-cup-globals'), {target}],
            assumeNoImportSideEffects && [
              require.resolve(
                './babel-plugins/babel-plugin-transform-tree-shake'
              ),
              {target},
            ],
          ].filter(Boolean)
        : []),
    ],
  };
}

module.exports = function buildPreset(
  context /*: any */,
  {
    targets,
    transformGlobals = true,
    assumeNoImportSideEffects = false,
  } /*: any */
) {
  const target = targets.hasOwnProperty('node') ? 'node' : 'browser';

  return {
    presets: [
      require('@babel/preset-react'),
      require('@babel/preset-flow'),
      [globalsPreset, {target, transformGlobals, assumeNoImportSideEffects}],
    ],
    plugins: [
      require('@babel/plugin-syntax-object-rest-spread'),
      require('@babel/plugin-syntax-dynamic-import'),
    ],
  };
};

module.exports.globalsPreset = globalsPreset;
