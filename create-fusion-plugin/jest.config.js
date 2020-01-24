// @flow
/* eslint-env node*/

module.exports = {
  cache: false,
  modulePathIgnorePatterns: ['templates/.*'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};
