/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {Token} from 'fusion-core';
import * as fusion_tokens from 'fusion-tokens';

declare const SessionSecretToken: Token<string>;
declare const SessionCookieNameToken: Token<string>;
declare const SessionCookieExpiresToken: Token<number>;

declare type SessionDeps = {
  secret: typeof SessionSecretToken;
  cookieName: typeof SessionCookieNameToken;
  expires: typeof SessionCookieExpiresToken.optional;
};

declare const _default: fusion_core.FusionPlugin<
  SessionDeps,
  fusion_tokens.Session
>;

export {
  SessionCookieExpiresToken,
  SessionCookieNameToken,
  SessionSecretToken,
  _default as default,
};
