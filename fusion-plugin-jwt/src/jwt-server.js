/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import assert from 'assert';
import {promisify} from 'util';
import jwt from 'jsonwebtoken';
import get from 'just-safe-get';
import set from 'just-safe-set';

import {createPlugin, memoize} from 'fusion-core';
import type {Context, FusionPlugin} from 'fusion-core';
import type {Session} from 'fusion-tokens';

import {
  SessionSecretToken,
  SessionCookieNameToken,
  SessionCookieExpiresToken,
} from './tokens.js';
import type {SessionDeps, SessionService} from './types.js';

// Scope path to `data.` here since `jsonwebtoken` has some special top-level keys that we do not want to expose (ex: `exp`)
const getFullPath = keyPath => `data.${keyPath}`;

type JWTConfig = {
  secret: string,
  cookieName: string,
  expires: number,
};

class JWTSession {
  cookie: string | void;
  token: ?Object | string;
  config: JWTConfig;

  constructor(ctx: Context, config: JWTConfig) {
    this.config = config;
    this.cookie = ctx.cookies.get(this.config.cookieName);
    this.token = null;
  }
  async loadToken() {
    if (this.token == null) {
      const verify = promisify(jwt.verify.bind(jwt));
      this.token = this.cookie
        ? await verify(this.cookie, this.config.secret).catch(() => ({}))
        : {};
    }
    return this.token;
  }
  get(keyPath: string): mixed {
    assert(
      this.token,
      "Cannot access token before loaded, please use this plugin before any of it's dependencies"
    );
    return get(this.token, getFullPath(keyPath));
  }
  set(keyPath: string, val: mixed): boolean {
    assert(
      this.token,
      "Cannot access token before loaded, please use this plugin before any of it's dependencies"
    );
    return set(this.token, getFullPath(keyPath), val);
  }
}

const p: FusionPlugin<SessionDeps, SessionService> = createPlugin({
  deps: {
    secret: SessionSecretToken,
    cookieName: SessionCookieNameToken,
    expires: SessionCookieExpiresToken.optional,
  },
  provides: deps => {
    const {secret, cookieName, expires = 86400} = deps;
    const service: SessionService = {
      from: memoize((ctx: Context) => {
        return new JWTSession(ctx, {secret, cookieName, expires});
      }),
    };
    return service;
  },
  middleware: (deps, service) => {
    const {secret, cookieName, expires = 86400} = deps;
    return async function jwtMiddleware(
      ctx: Context,
      next: () => Promise<void>
    ) {
      const sign = promisify(jwt.sign.bind(jwt));
      const session = service.from(ctx);
      const token = await session.loadToken();
      await next();
      if (token) {
        // $FlowFixMe
        delete token.exp; // Clear previous exp time and instead use `expiresIn` option below
        const time = Date.now(); // get time *before* async signing
        const signed = await sign(token, secret, {
          expiresIn: expires,
        });
        if (signed !== session.cookie) {
          const msExpires = new Date(time + expires * 1000);
          // TODO(#3) provide way to not set cookie if not needed yet
          ctx.cookies.set(cookieName, signed, {expires: msExpires});
        }
      }
    };
  },
});

export default ((p: any): FusionPlugin<SessionDeps, Session>);
