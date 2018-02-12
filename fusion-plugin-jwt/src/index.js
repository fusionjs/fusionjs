/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
// Main export file
import browser from './jwt-browser';
import server from './jwt-server';

import {
  SessionCookieExpiresToken,
  SessionCookieNameToken,
  SessionSecretToken,
} from './tokens';

declare var __BROWSER__ : Boolean;
export default (__BROWSER__ ? browser : server);

export {SessionCookieExpiresToken, SessionCookieNameToken, SessionSecretToken};
