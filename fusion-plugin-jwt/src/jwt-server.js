// @flow
/* eslint-env node */

import {createToken, createOptionalToken} from 'fusion-tokens';
import {createPlugin, memoize} from 'fusion-core';
import type {Context, FusionPlugin} from 'fusion-core';

export const SessionSecretToken: string = createToken('SessionSecret');
export const SessionCookieNameToken: string = createToken('SessionCookieName');
export const SessionCookieExpiresToken: number = createOptionalToken(
  'SessionCookieExpires',
  86400
);

const assert = require('assert');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const get = require('just-safe-get');
const set = require('just-safe-set');

const verify = promisify(jwt.verify.bind(jwt));
const sign = promisify(jwt.sign.bind(jwt));

// Scope path to `data.` here since `jsonwebtoken` has some special top-level keys that we do not want to expose (ex: `exp`)
const getFullPath = keyPath => `data.${keyPath}`;

type JWTConfig = {
  secret: string,
  cookieName: string,
  expires: number,
};

class JWTSession {
  cookie: string;
  token: ?Object | string;
  config: JWTConfig;

  constructor(ctx: Context, config: JWTConfig) {
    this.config = config;
    this.cookie = ctx.cookies.get(this.config.cookieName);
    this.token = null;
  }
  async loadToken() {
    if (this.token == null) {
      this.token = this.cookie
        ? await verify(this.cookie, this.config.secret).catch(() => ({}))
        : {};
    }
    return this.token;
  }
  get(keyPath: string) {
    assert(
      this.token,
      "Cannot access token before loaded, please use this plugin before any of it's dependencies"
    );
    return get(this.token, getFullPath(keyPath));
  }
  set(keyPath: string, val: any) {
    assert(
      this.token,
      "Cannot access token before loaded, please use this plugin before any of it's dependencies"
    );
    return set(this.token, getFullPath(keyPath), val);
  }
}

export type SessionService = {from: (ctx: Context) => JWTSession};
type SessionPluginType = FusionPlugin<JWTConfig, SessionService>;
const p: SessionPluginType = createPlugin({
  deps: {
    secret: SessionSecretToken,
    cookieName: SessionCookieNameToken,
    expires: SessionCookieExpiresToken,
  },
  provides: deps => {
    const {secret, cookieName, expires} = deps;
    const service = {
      from: memoize((ctx: Context) => {
        return new JWTSession(ctx, {secret, cookieName, expires});
      }),
    };
    return service;
  },
  middleware: (deps, service) => {
    const {secret, cookieName, expires} = deps;
    return async function jwtMiddleware(
      ctx: Context,
      next: () => Promise<void>
    ) {
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

export default p;
