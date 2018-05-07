/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

function getReactVersion() {
  try {
    const meta = require(process.cwd() + '/package.json');
    return meta.dependencies.react
      .split('.')
      .shift()
      .match(/\d+/);
  } catch (e) {
    return '16';
  }
}

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
    require.resolve(`./jest-framework-setup-${getReactVersion()}.js`),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: [`**/${testFolder}/**/*.js`],
  collectCoverageFrom: ['**.js', '!**/__integration__/**'],
  testResultsProcessor: require.resolve('./results-processor.js'),
};
