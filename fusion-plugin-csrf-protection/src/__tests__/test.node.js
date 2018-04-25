/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import test from 'tape-cup';

import App from 'fusion-core';
import type {Context} from 'fusion-core';
import {SessionToken} from 'fusion-tokens';
import type {Session} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import CsrfPlugin from '../server';
import {CsrfExpireToken, CsrfIgnoreRoutesToken} from '../shared';

function getSession(): Session {
  const state = {};
  const Session = {
    from() {
      return {
        set(key, value) {
          return (state[key] = value);
        },
        get(key) {
          return state[key];
        },
      };
    },
  };
  return Session;
}

test('valid token', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfPlugin);
  app.middleware((ctx, next) => {
    if (ctx.path === '/test') ctx.body = {ok: 1};
    return next();
  });
  const simulator = getSimulator(app);

  const ctx: Context = await simulator.request('/csrf-token', {method: 'POST'});
  t.ok(ctx.response.headers['x-csrf-token'], 'has token');
  t.equal(ctx.status, 200, 'has right status');
  t.equal(ctx.response.body, '', 'has empty body');
  const secret = Session.from(ctx).get('csrf-secret');
  t.ok(secret, 'sets a session secret');

  const renderCtx = await simulator.render('/');
  t.equal(ctx.status, 200, 'has right status');
  t.equal(
    secret,
    Session.from(renderCtx).get('csrf-secret'),
    'does not change the session secret'
  );
  const postCtx = await simulator.request('/test', {
    method: 'POST',
    headers: {
      'x-csrf-token': ctx.response.headers['x-csrf-token'],
    },
  });
  t.equal(postCtx.status, 200);
  t.end();
});

test('creates a session on a GET request', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfPlugin);
  app.middleware((ctx, next) => {
    if (ctx.path === '/') ctx.body = {ok: 1};
    return next();
  });
  const simulator = getSimulator(app);

  const ctx = await simulator.request('/');
  t.notok(
    ctx.response.headers['x-csrf-token'],
    'does not set x-csrf-token header'
  );
  t.equals(ctx.status, 200, 'has right status');
  t.ok(Session.from(ctx).get('csrf-secret'), 'sets the session');
  t.end();
});

test('render request', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfPlugin);
  const simulator = getSimulator(app);

  const ctx: Context = await simulator.render('/');
  t.notok(
    ctx.response.headers['x-csrf-token'],
    'does not set x-csrf-token header'
  );
  t.equals(ctx.status, 200, 'has right status');
  t.ok(Session.from(ctx).get('csrf-secret'), 'sets the session');
  t.ok(
    typeof ctx.response.body === 'string' &&
      ctx.response.body.includes('<script id="__CSRF_TOKEN__"'),
    'serializes token'
  );
  t.end();
});

test('fails with no session and invalid token', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfPlugin);
  const simulator = getSimulator(app);

  try {
    await simulator.request('/test', {
      method: 'POST',
      headers: {'x-csrf-token': 'invalid'},
    });
    t.fail('should fail');
  } catch (e) {
    t.equal(e.status, 403);
  }

  t.end();
});

test('fails with session and no token', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfPlugin);
  const simulator = getSimulator(app);

  await simulator.request('/csrf-token', {method: 'POST'});

  try {
    await simulator.request('/test', {
      method: 'POST',
    });
    t.fail('should fail');
  } catch (e) {
    t.equal(e.status, 403);
  }

  t.end();
});

test('fails with session and invalid token', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfPlugin);
  const simulator = getSimulator(app);

  await simulator.request('/csrf-token', {method: 'POST'});

  try {
    await simulator.request('/test', {
      method: 'POST',
      headers: {'x-csrf-token': 'invalid'},
    });
    t.fail('should fail');
  } catch (e) {
    t.equal(e.status, 403);
  }

  t.end();
});

test('fails with expired token', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfExpireToken, 1);
  app.register(CsrfPlugin);
  const simulator = getSimulator(app);

  const ctx = await simulator.request('/csrf-token', {method: 'POST'});

  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    await simulator.request('/test', {
      method: 'POST',
      headers: {'x-csrf-token': ctx.response.headers['x-csrf-token']},
    });
    t.fail('should fail');
  } catch (e) {
    t.equal(e.status, 403);
  }

  t.end();
});

test('does not verify ignored paths', async t => {
  const Session = getSession();
  const app = new App('fake-element', el => el);
  app.register(SessionToken, Session);
  app.register(CsrfPlugin);
  app.register(CsrfIgnoreRoutesToken, ['/test']);
  app.middleware((ctx, next) => {
    if (ctx.path === '/test') ctx.body = {ok: 1};
    return next();
  });
  const simulator = getSimulator(app);
  const ctx = await simulator.request('/test', {
    method: 'POST',
  });
  t.equal(ctx.status, 200);
  t.end();
});
