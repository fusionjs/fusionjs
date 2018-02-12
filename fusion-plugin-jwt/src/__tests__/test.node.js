// @flow
/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import tape from 'tape-cup';
import App, {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';
import {createServer} from 'http';
import fetch from 'node-fetch';
import JWTServer, {
  SessionSecretToken,
  SessionCookieNameToken,
  SessionCookieExpiresToken,
} from '../index';
import type {SessionService} from '../jwt-server';

const JWTToken: Token<SessionService> = createToken('Session');

tape('JWTServer', async t => {
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
      t.equal(session.get('test-something'), 'test-value');
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
  t.ok(res.headers.get('set-cookie'), 'generates a session');
  t.equal(res.status, 200);
  res = await fetch('http://localhost:3000/', {
    headers: {
      Cookie: res.headers.get('set-cookie'),
    },
  });
  t.equal(res.status, 200);
  server.close();
  t.end();
});

tape('JWTServer with expired token', async t => {
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
      t.notok(
        session.get('test-something'),
        'does not set the session if it has expired'
      );
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
  t.ok(res.headers.get('set-cookie'), 'generates a session');
  t.equal(res.status, 200);

  await new Promise(resolve => setTimeout(resolve, 2000));

  res = await fetch('http://localhost:3000/', {
    headers: {
      Cookie: res.headers.get('set-cookie'),
    },
  });
  t.equal(res.status, 200);
  server.close();
  t.end();
});
