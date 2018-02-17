/* eslint-env node */
const testTarget = require('./test');

exports.desc = testTarget.desc;
exports.builder = testTarget.builder;

exports.run = (...args) => {
  // eslint-disable-next-line no-console
  console.warn(
    'Deprecation warning: `fusion test-app` is deprecated, use `fusion test` instead.'
  );
  return testTarget.run(...args);
};
