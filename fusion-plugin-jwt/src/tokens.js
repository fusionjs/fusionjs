/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Token} from 'fusion-core';
import {createToken} from 'fusion-core';

export const SessionSecretToken: Token<string> = createToken('SessionSecret');
export const SessionCookieNameToken: Token<string> = createToken(
  'SessionCookieName'
);
export const SessionCookieExpiresToken: Token<number> = createToken(
  'SessionCookieExpires'
);
