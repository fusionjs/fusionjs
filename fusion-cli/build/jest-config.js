/* eslint-env node */

module.exports = {
  cache: true,
  rootDir: process.cwd(),
  setupFiles: [
    require.resolve('./jest-framework-shims.js'),
    require.resolve('./jest-framework-setup.js'),
  ],
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
};
