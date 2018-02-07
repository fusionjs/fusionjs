/* eslint-env node */

const baseJestConfig = require('../base-jest-config.js');

module.exports = {
  ...baseJestConfig,
  displayName: 'node',
  browser: false,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['.*\\.browser\\.js'],
};
