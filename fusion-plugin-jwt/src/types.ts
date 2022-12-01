/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context} from 'fusion-core';

import {
  SessionSecretToken,
  SessionCookieNameToken,
  SessionCookieExpiresToken,
} from './tokens.js';

export type SessionService = {
  from(ctx: Context): {
    loadToken(): Promise<?Object | string>,
    get(keyPath: string): mixed,
    set(keyPath: string, val: mixed): boolean,
    cookie: string | void,
  },
};

export type SessionDeps = {
  secret: typeof SessionSecretToken,
  cookieName: typeof SessionCookieNameToken,
  expires: typeof SessionCookieExpiresToken.optional,
};
