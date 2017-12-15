/* eslint-env node */

module.exports = {
  cache: true,
  rootDir: process.cwd(),
  globals: {
    __NODE__: process.env.JEST_ENV === 'node',
    __BROWSER__: process.env.JEST_ENV === 'jsdom',
  },
  setupFiles: [
    require.resolve('./jest-framework-shims.js'),
    require.resolve('./jest-framework-setup.js'),
  ],
  testPathIgnorePatterns: [
    process.env.JEST_ENV === 'node' ? '.*\\.browser\\.js' : '.*\\.node\\.js',
  ],
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
};
