/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*::
declare var __webpack_public_path__: string;
*/

import assert from 'assert';
import {URL} from 'url';

let prefix = load('ROUTE_PREFIX');
if (typeof prefix === 'string') {
  assert(!prefix.endsWith('/'), 'ROUTE_PREFIX must not end with /');
  assert(prefix.startsWith('/'), 'ROUTE_PREFIX must start with /');
}

let cdnUrl = load('CDN_URL');
if (typeof cdnUrl === 'string') {
  assert(!cdnUrl.endsWith('/'), 'CDN_URL must not end with /');
  assert(new URL(cdnUrl), 'CDN_URL must be valid absolute URL');
}

let assetBasePath = '/_static/';

if (prefix) {
  assetBasePath = prefix + assetBasePath;
}

// eslint-disable-next-line
__webpack_public_path__ = cdnUrl ? cdnUrl + '/' : assetBasePath;

function load(key) {
  const value = process.env[key];
  if (value === null) {
    return void 0;
  }
  return value;
}
