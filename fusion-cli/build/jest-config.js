/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

module.exports = {
  cache: true,
  globals: {
    // Parity with create-universal-package globals.
    // https://github.com/rtsao/create-universal-package#globals
    __NODE__: process.env.JEST_ENV === 'node',
    __BROWSER__: process.env.JEST_ENV === 'jsdom',
    __DEV__: process.env.NODE_ENV !== 'production',
  },
  browser: process.env.JEST_ENV === 'jsdom',
  coverageDirectory: `<rootDir>/coverage-${process.env.JEST_ENV}`,
  // 'cobertura', 'lcov', 'text' coverage reports are written by the merge-coverage script
  coverageReporters: ['json'],
  rootDir: process.cwd(),
  setupFiles: [
    require.resolve('./jest-framework-shims.js'),
    require.resolve('./jest-framework-setup.js'),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: [`**/${testFolder}/**/*.js`],
  testPathIgnorePatterns: [
    process.env.JEST_ENV === 'node' ? '.*\\.browser\\.js' : '.*\\.node\\.js',
  ],
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
};
