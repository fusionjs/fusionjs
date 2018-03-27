/* eslint-env node */

module.exports = function buildPreset(context, opts) {
  return {
    presets: [
      [require('./babel-transpilation-preset'), opts],
      [require('./babel-fusion-preset'), opts],
    ],
  };
};
