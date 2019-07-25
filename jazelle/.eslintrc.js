module.exports = {
  root: true,
  extends: [require.resolve('eslint-config-fusion')],
  env: {
    node: true,
  },
  rules: {
    'no-console': 0, // this package uses console to print info to stdout
    'jest/no-disabled-tests': 0, // this package does not use jest
  },
};
