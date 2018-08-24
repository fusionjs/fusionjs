/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const baseJestConfig = require('./base-jest-config.js');

// $FlowFixMe
const projects = process.env.JEST_ENV.split(',');

let config = {
  coverageDirectory: `${process.cwd()}/coverage`,
  // collectCoverageFrom doesn't work from project config,
  // must be set at top-level
  collectCoverageFrom: baseJestConfig.collectCoverageFrom,
  testResultsProcessor: baseJestConfig.testResultsProcessor,
};

// Use projects if we have more than one environment.
if (projects.length > 1) {
  // $FlowFixMe
  config.projects = projects.map(project => {
    return {
      // $FlowFixMe
      ...require(`./${project === 'jsdom' ? 'jsdom' : 'node'}/jest.config.js`),
    };
  });
} else {
  config = {
    // $FlowFixMe
    ...require(`./${
      projects[0] === 'jsdom' ? 'jsdom' : 'node'
    }/jest.config.js`),
  };
}

module.exports = config;
