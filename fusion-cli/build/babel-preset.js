/* eslint-env node */

/* @flow */

/*::
type PresetOpts = {|
  targets: {|browser: Object|} | {|node: 'current'|},
|};
*/

module.exports = function buildPreset(
  context /*: any */,
  opts /*: PresetOpts */
) {
  const target = opts.targets.hasOwnProperty('node') ? 'node' : 'browser';
  const modules = opts.modules === undefined ? false : opts.modules;
  return {
    presets: [
      [
        require('babel-preset-env'),
        {
          targets: opts.targets,
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
      [require.resolve('babel-plugin-transform-cup-globals'), {target: target}],
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
