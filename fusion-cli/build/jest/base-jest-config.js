/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
const fs = require('fs');
const {dirname} = require('path');

const rootDir = process.env.NODE_PRESERVE_SYMLINKS
  ? dirname(`${process.cwd()}/package.json`)
  : dirname(fs.realpathSync(`${process.cwd()}/package.json`));

const matchField /*: string */ = process.env.TEST_REGEX
  ? 'testRegex'
  : 'testMatch';
const matchValue = process.env.TEST_FOLDER
  ? [`**/${process.env.TEST_FOLDER || '__tests__'}/**/*.[jt]s?(x)`]
  : process.env.TEST_REGEX ||
    (process.env.TEST_MATCH || '**/__tests__/**/*.[jt]s?(x)').split(',');

function getReactMajorVersion(meta) {
  const react =
    (meta.dependencies && meta.dependencies.react) ||
    (meta.devDependencies && meta.devDependencies.react) ||
    (meta.peerDependencies && meta.peerDependencies.react);
  const matchResult = react.split('.').shift().match(/\d+/);
  return matchResult && matchResult[0];
}

function hasEnzyme(meta) {
  const enzyme =
    (meta.dependencies && meta.dependencies.enzyme) ||
    (meta.devDependencies && meta.devDependencies.enzyme);
  return Boolean(enzyme);
}

function getReactSetup() {
  // $FlowFixMe
  const meta = require(rootDir + '/package.json');
  if (hasEnzyme(meta)) {
    const reactVersion = getReactMajorVersion(meta);

    switch (reactVersion) {
      case '16':
        return [require.resolve('./jest-framework-setup-16.js')];
      case '17':
        return [require.resolve('./jest-framework-setup-17.js')];
      default:
        return [];
    }
  }

  return [];
}

const reactSetup = getReactSetup();

function getTransformIgnorePatterns() {
  const defaults = ['/node_modules/(?!(fusion-cli))'];
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

const baseJestConfig /*: { [key: string]: any } */ = {
  coverageDirectory: `${rootDir}/coverage`,
  coverageReporters: ['json'],
  rootDir,
  transform: {
    '\\.[jt]sx?$': require.resolve('./jest-transformer.js'),
    '\\.(gql|graphql)$': require.resolve('./graphql-jest-transformer.js'),
  },
  transformIgnorePatterns,
  setupFiles: [require.resolve('./jest-framework-shims.js'), ...reactSetup],
  snapshotSerializers:
    reactSetup.length > 0 ? [require.resolve('enzyme-to-json/serializer')] : [],
  [matchField]: matchValue,
  testURL: 'http://localhost:3000/',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
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

module.exports = baseJestConfig;
