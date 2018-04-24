/* eslint-env node */

const fs = require('fs');
const ci = require('ci-info');

module.exports = function resultsProcessor(results) {
  if (ci.isCI) {
    fs.mkdir('.fusion', err => {
      if (err && err.code !== 'EEXIST') throw err;
      fs.writeFile(
        './.fusion/test-results.json',
        JSON.stringify(results, null, 2),
        err => {
          if (err) throw err;
        }
      );
    });
  }
  return results;
};
