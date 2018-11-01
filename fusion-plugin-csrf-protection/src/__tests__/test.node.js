/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import test from 'tape-cup';

import App, {createPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import CsrfPlugin from '../server';
import {CsrfIgnoreRoutesToken} from '../shared';

function MockFetch() {
  return Promise.resolve();
}

function getApp() {
  const app = new App('fake-element', el => el);
  app.middleware(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      ctx.status = e.status || 500;
      ctx.body = e.message;
    }
  });
  // $FlowFixMe
  app.register(FetchToken, MockFetch);
  app.enhance(FetchToken, CsrfPlugin);
  return app;
}

test('valid token', async t => {
  const app = getApp();
  app.middleware((ctx, next) => {
    if (ctx.url === '/test' && ctx.method === 'POST') {
      ctx.status = 200;
      ctx.body = 'test';
    }
    return next();
  });
  const sim = getSimulator(app);
  const ctx = await sim.request('/test', {
    method: 'POST',
    headers: {
      'x-csrf-token': 'x',
    },
  });
  t.equal(ctx.status, 200);
  t.equal(ctx.body, 'test');
  t.end();
});

test('GET request', async t => {
  const app = getApp();
  app.middleware((ctx, next) => {
    if (ctx.url === '/test' && ctx.method === 'GET') {
      ctx.status = 200;
      ctx.body = 'test';
    }
    return next();
  });
  const sim = getSimulator(app);
  const ctx = await sim.request('/test');
  t.equal(ctx.status, 200);
  t.equal(ctx.body, 'test');
  t.end();
});

test('/csrf-token POST', async t => {
  const app = getApp();
  const sim = getSimulator(app);
  const ctx = await sim.request('/csrf-token', {
    method: 'POST',
  });
  t.equal(ctx.status, 200);
  t.end();
});

test('POST with missing token', async t => {
  const app = getApp();
  app.middleware((ctx, next) => {
    if (ctx.url === '/test' && ctx.method === 'POST') {
      ctx.status = 200;
      ctx.body = 'test';
    }
    return next();
  });
  const sim = getSimulator(app);
  const ctx = await sim.request('/test', {
    method: 'POST',
  });
  t.equal(ctx.status, 403);
  t.end();
});

test('does not verify ignored paths', async t => {
  const app = getApp();
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

test('throws if fetch is used on server', async t => {
  const app = getApp();
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: ({fetch}) => {
        fetch('/test').catch(e => {
          t.ok(e, 'throws on server');
          t.end();
        });
      },
    })
  );
  getSimulator(app);
});
