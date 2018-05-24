/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const pathJoin = require('./PathJoin');
const urlParse = require('url').parse;

function getFilenameFromUrl(
  publicPath /*: string */,
  outputPath /*: string */,
  url /*: string */
) {
  let filename;

  // localPrefix is the folder our bundle should be in
  const localPrefix = urlParse(publicPath || '/', false, true);
  const urlObject = urlParse(url);

  // publicPath has the hostname that is not the same as request url's, should fail
  if (
    localPrefix.hostname !== null &&
    urlObject.hostname !== null &&
    localPrefix.hostname !== urlObject.hostname
  ) {
    return false;
  }

  // publicPath is not in url, so it should fail
  if (
    publicPath &&
    localPrefix.hostname === urlObject.hostname &&
    url.indexOf(publicPath) !== 0
  ) {
    return false;
  }

  // strip localPrefix from the start of url
  if (
    urlObject.pathname &&
    // $FlowFixMe
    urlObject.pathname.indexOf(localPrefix.pathname) === 0
  ) {
    // $FlowFixMe
    filename = urlObject.pathname.substr(localPrefix.pathname.length);
  }

  if (
    !urlObject.hostname &&
    localPrefix.hostname &&
    // $FlowFixMe
    url.indexOf(localPrefix.path) !== 0
  ) {
    return false;
  }
  // and if not match, use outputPath as filename
  return decodeURIComponent(
    filename ? pathJoin(outputPath, filename) : outputPath
  );
}

module.exports = getFilenameFromUrl;
