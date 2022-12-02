/* eslint-env node */

module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testPathIgnorePatterns: [
        '/node_modules/',
        '\\.browser\\.test\\.[jt]sx?$',
        'dist',
        'lib',
        'setup-jest.ts',
      ],
      globals: {
        __NODE__: true,
        __BROWSER__: false,
        __DEV__: true,
      },
    },
    {
      displayName: 'browser',
      testEnvironment: 'jsdom',
      testPathIgnorePatterns: [
        '/node_modules/',
        '\\.node\\.test\\.[jt]sx?$',
        'dist',
        'lib',
        'setup-jest.ts',
      ],
      globals: {
        __NODE__: false,
        __BROWSER__: true,
        __DEV__: true,
      },
      setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.ts'],
    },
  ],
};
