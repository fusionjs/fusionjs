/* eslint-env node */

const fs = require('fs');

module.exports = function resultsProcessor(results) {
  const testMetadataPath = process.env.FUSION_TEST_METADATA_PATH;
  if (testMetadataPath) {
    fs.writeFile(testMetadataPath, JSON.stringify(results, null, 2), err => {
      if (err) throw err;
    });
  }
  return results;
};
