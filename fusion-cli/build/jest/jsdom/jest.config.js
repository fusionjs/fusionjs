/* eslint-env node */

const baseJestConfig = require('../base-jest-config.js');

module.exports = {
  ...baseJestConfig,
  displayName: 'browser',
  browser: true,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['.*\\.node\\.js'],
};
