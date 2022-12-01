/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App from 'fusion-core';
import express from 'express';
import {HttpHandlerToken} from '../src/tokens.js';
import HttpHandlerPlugin from '../src/server.js';
import {startServer} from '../src/test-util.js';

test('error after await next in middleware before http handler', async () => {
  const app = new App('test', () => 'test');
  // Error handler
  app.middleware(async (ctx, next) => {
    await expect(next()).rejects.toThrow('FAIL');
    ctx.body = 'Caught error';
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

  expect(await request('/')).toBe('Caught error');
  expect(hitExpressMiddleware).toBe(true);
  expect(hitFallthrough).toBe(true);

  server.close();
});

test('error before await next in middleware after http handler', async () => {
  const app = new App('test', () => 'test');
  // Error handler
  app.middleware(async (ctx, next) => {
    await expect(next()).rejects.toThrow('FAIL');
    ctx.body = 'Caught error';
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

  expect(await request('/')).toBe('Caught error');
  expect(hitExpressMiddleware).toBe(false);
  expect(hitFallthrough).toBe(false);

  server.close();
});

test('error in express middleware', async () => {
  const app = new App('test', () => 'test');
  // Error handler
  app.middleware(async (ctx, next) => {
    await expect(next()).rejects.toThrow('FAIL');
    ctx.body = 'Caught error';
  });

  app.register(HttpHandlerPlugin);
  const expressApp = express();
  expressApp.use((req, res, next) => {
    return next(new Error('FAIL'));
  });

  app.register(HttpHandlerToken, expressApp);

  const {server, request} = await startServer(app.callback());

  expect(await request('/')).toBe('Caught error');
  server.close();
});
