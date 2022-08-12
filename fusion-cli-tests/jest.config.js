// @flow
/* eslint-env node */

module.exports = {
  resolver: require.resolve('jest-pnp-resolver'),
  testEnvironment: 'node',
  testPathIgnorePatterns: ['test/e2e/.*/fixture', 'commands/test.js'],
};
