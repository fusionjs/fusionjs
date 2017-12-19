/* eslint-env node */

/* @flow */

/*::
type PresetOpts = {|
  targets: {|browser: Object|} | {|node: 'current'|},
  modules: boolean,
  transformGlobals: boolean
|};
*/

module.exports = function buildPreset(
  context /*: any */,
  {targets, modules = false, transformGlobals = true} /*: PresetOpts */
) {
  const target = targets.hasOwnProperty('node') ? 'node' : 'browser';

  return {
    presets: [
      [
        require('babel-preset-env'),
        {
          targets: targets,
          modules: modules,
          exclude: ['transform-regenerator', 'transform-async-to-generator'],
        },
      ],
      require('babel-preset-react'),
    ],
    plugins: [
      require('babel-plugin-transform-async-generator-functions'),
      require('babel-plugin-transform-class-properties'),
      [
        require('babel-plugin-transform-object-rest-spread'),
        {
          useBuiltIns: true,
        },
      ],
      ...(transformGlobals
        ? [
            [
              require.resolve('babel-plugin-transform-cup-globals'),
              {target: target},
            ],
          ]
        : []),
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
