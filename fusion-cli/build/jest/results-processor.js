/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');

module.exports = function resultsProcessor(results /*: any */) {
  const testMetadataPath = process.env.FUSION_TEST_METADATA_PATH;
  if (testMetadataPath) {
    fs.writeFile(testMetadataPath, JSON.stringify(results, null, 2), err => {
      if (err) throw err;
    });
  }
  return results;
};
