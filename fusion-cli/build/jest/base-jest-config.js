/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

module.exports = {
  cache: false,
  coverageDirectory: `${process.cwd()}/coverage`,
  coverageReporters: ['json'],
  rootDir: process.cwd(),
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
  setupFiles: [
    require.resolve('./jest-framework-shims.js'),
    require.resolve('./jest-framework-setup.js'),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: [`**/${testFolder}/**/*.js`],
};
