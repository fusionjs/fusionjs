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

import {getEnv} from 'fusion-core';

const {prefix, cdnUrl, dangerouslyExposeSourceMaps} = getEnv();
if (typeof prefix === 'string' && prefix !== '') {
  assert(prefix.startsWith('/'), 'ROUTE_PREFIX must start with /');
}
if (typeof cdnUrl === 'string' && cdnUrl !== '') {
  assert(new URL(cdnUrl), 'CDN_URL must be valid absolute URL');
}

let assetBasePath = '/_static/';
if (prefix) {
  assetBasePath = prefix + assetBasePath;
}

// eslint-disable-next-line
__webpack_public_path__ =
  cdnUrl && !dangerouslyExposeSourceMaps ? cdnUrl + '/' : assetBasePath;
