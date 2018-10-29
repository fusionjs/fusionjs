/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const Shared = require('./lib/Shared');

// constructor for the middleware
module.exports = function(compiler /*: any */, options /*: any */) {
  options = options || {};
  const context = {
    state: false,
    compiler: compiler,
  };
  const shared = Shared(context);

  // The middleware function
  function webpackDevMiddleware(
    req /*: any */,
    res /*: any */,
    next /*: any */
  ) {
    function goNext() {
      // $FlowFixMe
      shared.waitUntilValid(function() {
        next();
      }, req);
    }

    return goNext();
  }

  return webpackDevMiddleware;
};
