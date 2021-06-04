/* eslint-env node */
// @flow
module.exports = {
  extends: ['../linter/.eslintrc.js'],
  env: {
    node: true,
  },
  rules: {
    'import/no-dynamic-require': 0,
    'import/no-webpack-loader-syntax': 0,
  },
};
