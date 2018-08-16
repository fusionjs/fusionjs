/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

function getReactVersion() {
  // $FlowFixMe
  const meta = require(process.cwd() + '/package.json');
  const react =
    (meta.dependencies && meta.dependencies.react) ||
    (meta.devDependencies && meta.devDependencies.react) ||
    (meta.peerDependencies && meta.peerDependencies.react);
  return react
    .split('.')
    .shift()
    .match(/\d+/);
}
function getReactSetup() {
  try {
    return [require.resolve(`./jest-framework-setup-${getReactVersion()}.js`)];
  } catch (e) {
    return [];
  }
}

const reactSetup = getReactSetup();

module.exports = {
  cache: false,
  coverageDirectory: `${process.cwd()}/coverage`,
  coverageReporters: ['json'],
  rootDir: process.cwd(),
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
  setupFiles: [require.resolve('./jest-framework-shims.js'), ...reactSetup],
  snapshotSerializers:
    reactSetup.length > 0 ? [require.resolve('enzyme-to-json/serializer')] : [],
  testMatch: [`**/${testFolder}/**/*.js`],
  testURL: 'http://localhost:3000/',
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/__integration__/**',
    '!**/node_modules/**',
  ],
  testResultsProcessor: require.resolve('./results-processor.js'),
};
