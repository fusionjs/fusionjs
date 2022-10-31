// @flow
/* eslint-env node */

module.exports = {
  projects: [
    {
      resolver: require.resolve('jest-resolver-fusion'),
      displayName: 'node',
      testEnvironment: 'node',
      testPathIgnorePatterns: ['/node_modules/', '.browser.js', 'dist'],
      globals: {
        __NODE__: true,
        __BROWSER__: false,
        __DEV__: true,
      },
    },
    {
      resolver: require.resolve('jest-resolver-fusion-browser'),
      displayName: 'browser',
      testEnvironment: 'jest-environment-jsdom-global',
      testPathIgnorePatterns: ['/node_modules/', '.node.js', 'dist'],
      globals: {
        __NODE__: false,
        __BROWSER__: true,
        __DEV__: true,
      },
    },
  ],
};
