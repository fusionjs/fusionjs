/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import crypto from 'crypto';
import base64Url from 'base64-url';

import {SessionToken} from 'fusion-tokens';
import {html, createPlugin} from 'fusion-core';
import type {FusionPlugin, Middleware} from 'fusion-core';

import {
  verifyMethod,
  verifyExpiry,
  CsrfIgnoreRoutesToken,
  CsrfExpireToken,
} from './shared';
import type {CsrfDepsType, CsrfServiceType} from './flow.js';

function generateSecret() {
  const random = crypto.randomBytes(32);
  const escaped = base64Url.escape(random.toString());
  return escaped.slice(0, 32);
}
function generateToken(secret) {
  const timestamp = Math.round(Date.now() / 1000);
  return tokenize(secret, timestamp.toString());
}
function verifyToken(secret, token) {
  if (!secret || !token) return false;
  const [timestamp] = token.split('-');
  return token === tokenize(secret, timestamp);
}
function tokenize(secret, salt) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(salt)
    .digest('base64');
  return salt + '-' + base64Url.escape(hmac);
}

function loadOrGenerateSecret(session) {
  let secret = session.get('csrf-secret');
  if (!secret) {
    secret = generateSecret();
    session.set('csrf-secret', secret);
  }
  return secret;
}

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {
      Session: SessionToken,
      expire: CsrfExpireToken.optional,
      ignored: CsrfIgnoreRoutesToken.optional,
    },
    provides: () => () =>
      Promise.reject(new Error('Cannot use fetch on the server')),
    middleware: deps => {
      const {Session = {}, expire = 86400, ignored = []} = deps;
      const ignoreSet = new Set(ignored);
      const handleTokenPost: Middleware = (ctx, next) => {
        const session = Session.from(ctx);
        const secret = loadOrGenerateSecret(session);
        ctx.set('x-csrf-token', generateToken(secret));
        ctx.status = 200;
        ctx.body = '';
        return next();
      };

      async function checkCSRF(ctx, next) {
        const session = Session.from(ctx);

        const token = ctx.headers['x-csrf-token'];
        const secret = session.get('csrf-secret');
        const isMatchingToken = verifyToken(secret, token);
        const isValidToken = verifyExpiry(token, expire);
        if (!isMatchingToken || !isValidToken) {
          const message = __DEV__
            ? 'CSRF Token configuration error: ' +
              'Ensure you are using `fetch` from `fusion-plugin-csrf-protection-[react].'
            : 'Invalid CSRF Token';
          ctx.throw(403, message);
        } else {
          return next();
        }
      }

      return async function csrfMiddleware(ctx, next) {
        if (ctx.path === '/csrf-token' && ctx.method === 'POST') {
          return handleTokenPost(ctx, next);
        } else if (verifyMethod(ctx.method) && !ignoreSet.has(ctx.path)) {
          return checkCSRF(ctx, next);
        } else {
          const session = Session.from(ctx);
          const secret = loadOrGenerateSecret(session);
          if (ctx.element) {
            const token = generateToken(secret);
            // $FlowFixMe
            ctx.template.body.push(
              html`<script id="__CSRF_TOKEN__" type="application/json">${JSON.stringify(
                token
              )}</script>`
            );
          }
          return next();
        }
      };
    },
  });

export default ((plugin: any): FusionPlugin<CsrfDepsType, CsrfServiceType>);
