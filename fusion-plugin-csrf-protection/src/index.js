/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import serverCsrf from './server.js';
import clientCsrf from './browser.js';

declare var __NODE__: Boolean;
export default (__NODE__ ? serverCsrf : clientCsrf);

export {
  FetchForCsrfToken,
  CsrfExpireToken,
  CsrfIgnoreRoutesToken,
} from './shared';
