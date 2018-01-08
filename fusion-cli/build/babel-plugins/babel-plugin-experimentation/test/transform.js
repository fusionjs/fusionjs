/* eslint-env node */
const {transform} = require('babel-core');
const plugin = require('../');
const babelPluginSyntaxJsx = require('babel-plugin-syntax-jsx');

module.exports = function doTransform(inputString) {
  return (
    transform(inputString.trim(), {
      filename: 'fake-file.js',
      plugins: [
        [
          plugin,
          {
            addExport: true,
          },
        ],
        babelPluginSyntaxJsx,
      ],
    })
      .code.trim()
      // Normalize quotes
      .replace(/"/g, "'")
  );
};
