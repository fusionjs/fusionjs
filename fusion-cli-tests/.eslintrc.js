module.exports = {
  root: true,
  extends: [require.resolve('eslint-config-fusion')],
  rules: {
    'import/no-dynamic-require': 0,
    'import/no-webpack-loader-syntax': 0,
  }
};
