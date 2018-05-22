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

test('http handler with express', async t => {
  const app = new App('test', () => 'test');
  app.middleware((ctx, next) => {
    if (ctx.url === '/send') {
      ctx.body = 'hello world';
    }
    return next();
  });
  app.register(HttpHandlerPlugin);
  let hitExpressMiddleware = false;
  const expressApp = express();
  expressApp.use((req, res, next) => {
    hitExpressMiddleware = true;
    return next();
  });
  expressApp.get('/lol', (req, res) => {
    res.status(200);
    res.end('OK');
  });

  app.register(HttpHandlerToken, expressApp);

  app.middleware((ctx, next) => {
    if (!ctx.body) {
      ctx.body = 'hit fallthrough';
    }
    return next();
  });

  const {server, request} = await startServer(app.callback());

  t.equal(
    await request('/send'),
    'hello world',
    'can send response from koa middleware'
  );
  t.equal(
    hitExpressMiddleware,
    false,
    'does not run through express middleware if response is sent by koa'
  );

  t.equal(await request('/lol'), 'OK', 'express routes can send responses');
  t.equal(hitExpressMiddleware, true, 'express middleware hit');

  hitExpressMiddleware = false;

  t.equal(
    await request('/fallthrough'),
    'hit fallthrough',
    'express routes can delegate back to koa'
  );
  t.equal(hitExpressMiddleware, true, 'express middleware hit');

  server.close();
  t.end();
});
