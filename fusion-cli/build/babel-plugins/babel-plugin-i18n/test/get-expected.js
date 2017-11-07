/* eslint-env node */
const stripIndent = require('strip-indent');
const sharedExpectedContent = require('./shared-expected-content.js');
module.exports = function getExpected(inputString, includeShared = true) {
  const sharedContent = includeShared ? '\n' + sharedExpectedContent() : '';
  return (stripIndent(inputString).trim() + sharedContent).replace(/"/g, "'");
};
