/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App from 'fusion-core';
import express from 'express';
import {HttpHandlerToken} from '../tokens.js';
import HttpHandlerPlugin from '../server.js';
import {startServer} from '../test-util.js';

test('error after await next in middleware before http handler', async t => {
  const app = new App('test', () => 'test');
  // Error handler
  app.middleware(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      t.equal(e.message, 'FAIL', 'catches correct error');
      ctx.body = 'Caught error';
    }
  });

  // Trigger error in upstream
  app.middleware(async (ctx, next) => {
    await next();
    throw new Error('FAIL');
  });
  app.register(HttpHandlerPlugin);
  let hitExpressMiddleware = false;
  let hitFallthrough = false;
  const expressApp = express();
  expressApp.use((req, res, next) => {
    hitExpressMiddleware = true;
    return next();
  });

  app.register(HttpHandlerToken, expressApp);

  app.middleware((ctx, next) => {
    hitFallthrough = true;
    return next();
  });

  const {server, request} = await startServer(app.callback());

  t.equal(await request('/'), 'Caught error', 'catches errors');
  t.equal(hitExpressMiddleware, true);
  t.equal(hitFallthrough, true);

  server.close();
  t.end();
});

test('error before await next in middleware after http handler', async t => {
  const app = new App('test', () => 'test');
  // Error handler
  app.middleware(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      t.equal(e.message, 'FAIL', 'catches correct error');
      ctx.body = 'Caught error';
    }
  });

  app.register(HttpHandlerPlugin);
  let hitExpressMiddleware = false;
  let hitFallthrough = false;
  const expressApp = express();
  expressApp.use((req, res, next) => {
    hitExpressMiddleware = true;
    return next();
  });

  app.register(HttpHandlerToken, expressApp);

  // Trigger error in downstream
  app.middleware(async () => {
    await Promise.resolve();
    throw new Error('FAIL');
  });

  app.middleware((ctx, next) => {
    hitFallthrough = true;
    return next();
  });

  const {server, request} = await startServer(app.callback());

  t.equal(await request('/'), 'Caught error', 'catches errors');
  t.equal(hitExpressMiddleware, true);
  t.equal(hitFallthrough, false);

  server.close();
  t.end();
});
