/* eslint-env node */

module.exports = {
  cache: true,
  globals: {
    // Parity with create-universal-package globals.
    // https://github.com/rtsao/create-universal-package#globals
    __NODE__: process.env.JEST_ENV === 'node',
    __BROWSER__: process.env.JEST_ENV === 'jsdom',
    __DEV__: process.env.NODE_ENV !== 'production',
  },
  coverageReporters: ['json', 'lcov', 'text', 'cobertura'],
  rootDir: process.cwd(),
  setupFiles: [
    require.resolve('./jest-framework-shims.js'),
    require.resolve('./jest-framework-setup.js'),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testPathIgnorePatterns: [
    process.env.JEST_ENV === 'node' ? '.*\\.browser\\.js' : '.*\\.node\\.js',
  ],
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
};
