/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Context } from "fusion-core";

import {
  SessionSecretToken,
  SessionCookieNameToken,
  SessionCookieExpiresToken,
} from "./tokens";

export type SessionService = {
  from(ctx: Context): {
    loadToken(): Promise<any | string>;
    get(keyPath: string): unknown;
    set(keyPath: string, val: unknown): boolean;
    cookie: string | void;
  };
};

export type SessionDeps = {
  secret: typeof SessionSecretToken;
  cookieName: typeof SessionCookieNameToken;
  expires: typeof SessionCookieExpiresToken.optional;
};
