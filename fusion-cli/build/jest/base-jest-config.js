/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const matchField = process.env.TEST_REGEX ? 'testRegex' : 'testMatch';
const matchValue = process.env.TEST_FOLDER
  ? [`**/${process.env.TEST_FOLDER || '__tests__'}/**/*.js`]
  : process.env.TEST_REGEX ||
    (process.env.TEST_MATCH || '**/__tests__/**/*.js').split(',');

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

function getTransformIgnorePatterns() {
  const defaults = ['/node_modules/(?!(fusion-cli.*build))'];
  try {
    const path = require('path');
    // $FlowFixMe
    const fusionrc = require(path.resolve(process.cwd(), '.fusionrc.js'));
    return fusionrc.jest.transformIgnorePatterns;
  } catch (e) {
    return defaults;
  }
}

const transformIgnorePatterns = getTransformIgnorePatterns();

module.exports = {
  coverageDirectory: `${process.cwd()}/coverage`,
  coverageReporters: ['json'],
  rootDir: process.cwd(),
  transform: {
    '\\.js$': require.resolve('./jest-transformer.js'),
    '\\.(gql|graphql)$': require.resolve('./graphql-jest-transformer.js'),
  },
  transformIgnorePatterns,
  setupFiles: [require.resolve('./jest-framework-shims.js'), ...reactSetup],
  snapshotSerializers:
    reactSetup.length > 0 ? [require.resolve('enzyme-to-json/serializer')] : [],
  [matchField]: matchValue,
  testURL: 'http://localhost:3000/',
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/__generated__/**',
    '!**/__integration__/**',
    '!**/__tests__/**',
    '!**/node_modules/**',
    ...(process.env.COVERAGE_PATHS
      ? process.env.COVERAGE_PATHS.split(',')
      : []),
  ],
  testResultsProcessor: require.resolve('./results-processor.js'),
};
