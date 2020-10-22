/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
const fs = require('fs');
const path = require('path');

/*::
export type MainOpts = {|
  dir: string
|}
 */

const validExtensions = ['ts', 'js'];

module.exports = {
  getMain,
};

function getMain({dir} /*: MainOpts */) {
  for (const e of validExtensions) {
    const main = 'src/main.' + e;

    if (fs.existsSync(path.join(dir, main))) {
      return main;
    }
  }
}
