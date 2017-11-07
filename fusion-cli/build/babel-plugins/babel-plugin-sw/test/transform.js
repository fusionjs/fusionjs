const {transform} = require('babel-core');
const plugin = require('../');
/* eslint-env node */
module.exports = function doTransform(inputString) {
  return (
    transform(inputString.trim(), {
      plugins: [[plugin]],
    }).code
      .trim()
      // Normalize quotes
      .replace(/"/g, "'")
  );
};
