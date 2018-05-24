/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

module.exports = function stripPrefix(req /*: any */, prefix /*: string */) {
  if (req.url.indexOf(prefix) === 0) {
    req.url = req.url.slice(prefix.length);
    if (req.url === '') {
      req.url = '/';
    }
  }
};
