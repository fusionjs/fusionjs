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

let assetsPath = load('FRAMEWORK_STATIC_ASSET_PATH');
if (typeof assetsPath === 'string') {
  assert(
    !assetsPath.endsWith('/'),
    'FRAMEWORK_STATIC_ASSET_PATH must not end with /'
  );
  assert(
    assetsPath.startsWith('/'),
    'FRAMEWORK_STATIC_ASSET_PATH must start with /'
  );
}

let assetBasePath = assetsPath ? assetsPath + '/' : '/_static/';

if (prefix) {
  assetBasePath = prefix + assetBasePath;
}

const dangerouslyExposeSourceMaps = load('DANGEROUSLY_EXPOSE_SOURCE_MAPS');
// eslint-disable-next-line
__webpack_public_path__ =
  cdnUrl && !dangerouslyExposeSourceMaps ? cdnUrl + '/' : assetBasePath;

function load(key) {
  const value = process.env[key];
  if (value === null) {
    return void 0;
  }
  return value;
}
