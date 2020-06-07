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

function getFusionrc() {
  try {
    const path = require('path');
    // $FlowFixMe
    const fusionrc = require(path.resolve(process.cwd(), '.fusionrc.js'));
    return fusionrc;
  } catch (e) {
    return {};
  }
}

const {jest: jestConfig, jsExtPattern} = getFusionrc();
const testFileExt = jsExtPattern ? jsExtPattern.source : '\\.js$';
const globFileExt = (jestConfig && jestConfig.globFileExt) || '.js';

const TRANSFORM_IGNORE_PATTERNS = ['/node_modules/(?!(fusion-cli.*build))'];
const matchField = process.env.TEST_REGEX ? 'testRegex' : 'testMatch';
const matchValue = process.env.TEST_FOLDER
  ? [`**/${process.env.TEST_FOLDER || '__tests__'}/**/*${globFileExt}`]
  : process.env.TEST_REGEX ||
    (process.env.TEST_MATCH || `**/__tests__/**/*${globFileExt}`).split(',');

function getReactVersion(meta) {
  const react =
    (meta.dependencies && meta.dependencies.react) ||
    (meta.devDependencies && meta.devDependencies.react) ||
    (meta.peerDependencies && meta.peerDependencies.react);
  return react
    .split('.')
    .shift()
    .match(/\d+/);
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
    try {
      return [
        require.resolve(`./jest-framework-setup-${getReactVersion(meta)}.js`),
      ];
    } catch (e) {
      return [];
    }
  }
  return [];
}

const reactSetup = getReactSetup();

const transformIgnorePatterns =
  (jestConfig && jestConfig.transformIgnorePatterns) ||
  TRANSFORM_IGNORE_PATTERNS;

module.exports = {
  coverageDirectory: `${rootDir}/coverage`,
  coverageReporters: ['json'],
  rootDir,
  transform: {
    [testFileExt]: require.resolve('./jest-transformer.js'),
    '\\.(gql|graphql)$': require.resolve('./graphql-jest-transformer.js'),
  },
  transformIgnorePatterns,
  setupFiles: [require.resolve('./jest-framework-shims.js'), ...reactSetup],
  setupFilesAfterEnv: jestConfig && jestConfig.setupFilesAfterEnv,
  snapshotSerializers:
    reactSetup.length > 0 ? [require.resolve('enzyme-to-json/serializer')] : [],
  [matchField]: matchValue,
  testURL: 'http://localhost:3000/',
  collectCoverageFrom: [
    `src/**/*${globFileExt}`,
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
