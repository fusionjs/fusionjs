/* eslint-env node */
// @flow
module.exports = {
  root: true,
  extends: ['../linter/.eslintrc.js'],
  rules: {
    'import/no-dynamic-require': 0,
    'import/no-webpack-loader-syntax': 0,
  },
};
