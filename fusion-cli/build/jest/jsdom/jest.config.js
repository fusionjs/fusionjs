/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const baseJestConfig = require('../base-jest-config.js');

module.exports = {
  ...baseJestConfig,
  resolver: require.resolve('../resolver.js'),
  displayName: 'browser',
  browser: true,
  name: 'browser',
  // Exposes global.jsdom so we can reconfigure the url on each simulator.render call
  testEnvironment: 'jest-environment-jsdom-global',
  testPathIgnorePatterns: ['.*\\.node\\.js'],
};
