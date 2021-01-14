/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import App from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import CsrfPlugin from '../src/server';
import {CsrfIgnoreRoutesToken} from '../src/shared';

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

test('valid token', async () => {
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
  expect(ctx.status).toBe(200);
  expect(ctx.body).toBe('test');
});

test('GET request', async () => {
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
  expect(ctx.status).toBe(200);
  expect(ctx.body).toBe('test');
});

test('/csrf-token POST', async () => {
  const app = getApp();
  const sim = getSimulator(app);
  const ctx = await sim.request('/csrf-token', {
    method: 'POST',
  });
  expect(ctx.status).toBe(200);
});

test('POST with missing token', async () => {
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
  expect(ctx.status).toBe(403);
});

test('does not verify ignored paths', async () => {
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
  expect(ctx.status).toBe(200);
});
