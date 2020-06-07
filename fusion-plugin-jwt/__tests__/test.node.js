/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App, {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';
import {createServer} from 'http';
import fetch from 'node-fetch';
import type {Session} from 'fusion-tokens';

import JWTServer, {
  SessionSecretToken,
  SessionCookieNameToken,
  SessionCookieExpiresToken,
} from '../src/index';

const JWTToken: Token<Session> = createToken('Session');

test('JWTServer', async () => {
  const app = new App('fake-element', el => el);
  app.register(SessionSecretToken, 'session-secret');
  app.register(SessionCookieNameToken, 'cookie-name');
  app.register(SessionCookieExpiresToken, 86300);
  app.register(JWTToken, JWTServer);
  let count = 0;
  app.middleware({Session: JWTToken}, ({Session}) => (ctx, next) => {
    count++;
    const session = Session.from(ctx);
    if (count === 2) {
      expect(session.get('test-something')).toBe('test-value');
    }
    session.set('test-something', 'test-value');
    ctx.body = 'OK';
    return next();
  });
  const cb = app.callback();
  // $FlowFixMe
  const server = createServer(cb);
  await new Promise(resolve => server.listen(3000, resolve));
  let res = await fetch('http://localhost:3000/');
  expect(res.headers.get('set-cookie')).toBeTruthy();
  expect(res.status).toBe(200);
  res = await fetch('http://localhost:3000/', {
    headers: {
      Cookie: res.headers.get('set-cookie') || '',
    },
  });
  expect(res.status).toBe(200);
  server.close();
});

test('JWTServer with expired token', async () => {
  const app = new App('fake-element', el => el);
  app.register(SessionSecretToken, 'session-secret');
  app.register(SessionCookieNameToken, 'cookie-name');
  app.register(SessionCookieExpiresToken, 1);
  app.register(JWTToken, JWTServer);

  let count = 0;
  app.middleware({Session: JWTToken}, ({Session}) => (ctx, next) => {
    count++;
    const session = Session.from(ctx);
    if (count === 2) {
      expect(session.get('test-something')).toBeFalsy();
    }
    session.set('test-something', 'test-value');
    ctx.body = 'OK';
    return next();
  });

  const cb = app.callback();
  // $FlowFixMe
  const server = createServer(cb);
  await new Promise(resolve => server.listen(3000, resolve));
  let res = await fetch('http://localhost:3000/');
  expect(res.headers.get('set-cookie')).toBeTruthy();
  expect(res.status).toBe(200);

  await new Promise(resolve => setTimeout(resolve, 2000));

  res = await fetch('http://localhost:3000/', {
    headers: {
      Cookie: res.headers.get('set-cookie') || '',
    },
  });
  expect(res.status).toBe(200);
  server.close();
});
