/* eslint-env node */

module.exports = {
  cache: true,
  rootDir: process.cwd(),
  setupFiles: [
    '<rootDir>/node_modules/fusion-cli/build/jest-framework-shims.js',
    '<rootDir>/node_modules/fusion-cli/build/jest-framework-setup.js',
  ],
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/fusion-cli/build/jest-transformer.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
};
