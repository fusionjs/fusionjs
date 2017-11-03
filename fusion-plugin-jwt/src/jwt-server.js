//@flow
/* eslint-env node */

export default ({secret, cookieName = 'fusion-sess', expiresIn = 86400}) => {
  const assert = require('assert');
  const {promisify} = require('util');
  const jwt = require('jsonwebtoken');
  const {Plugin} = require('fusion-core');
  const get = require('just-safe-get');
  const set = require('just-safe-set');
  const verify = promisify(jwt.verify.bind(jwt));
  const sign = promisify(jwt.sign.bind(jwt));

  assert(typeof secret === 'string', '{secret} should be a string');
  assert(typeof cookieName === 'string', '{cookieName} should be a string');
  return new Plugin({
    Service: class JWTSession {
      constructor(ctx) {
        assert(ctx, 'JWTSession requires a ctx object');
        this.cookie = ctx.cookies.get(cookieName);
        this.token = null;
      }
      async loadToken() {
        if (this.token == null) {
          this.token = this.cookie ? await verify(this.cookie, secret) : {};
        }
        return this.token;
      }
      get(keyPath) {
        return get(this.token, keyPath);
      }
      set(keyPath, val) {
        return set(this.token, keyPath, val);
      }
    },
    async middleware(ctx, next) {
      const session = this.of(ctx);
      const token = await session.loadToken();
      await next();
      if (token) {
        delete token.exp;
        const time = Date.now(); // get time *before* async signing
        const signed = await sign(token, secret, {expiresIn});
        if (signed !== session.cookie) {
          const expires = new Date(time + expiresIn * 1000);
          // TODO(#3) provide way to not set cookie if not needed yet
          ctx.cookies.set(cookieName, signed, {expires});
        }
      }
    },
  });
};
