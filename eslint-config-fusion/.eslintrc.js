module.exports = {
  root: true,
  extends: require.resolve('./index.js'),
  env: {
    node: true
  },
  rules: {
    'require-atomic-updates': 0
  }
};
