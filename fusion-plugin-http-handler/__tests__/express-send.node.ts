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

test('http handler with express using send', async () => {
  const app = new App('test', () => 'test');

  app.middleware(async (ctx, next) => {
    await next();
    if (ctx.url === '/express') {
      expect(ctx.res.statusCode).toBe(200);
    } else {
      expect(ctx.res.statusCode).toBe(404);
    }
    // $FlowFixMe
    ctx.req.secure = false;
    ctx.body = 'hit fallthrough';
  });
  app.register(HttpHandlerPlugin);
  const expressApp = express();
  expressApp.get('/express', (req, res) => {
    res.send('OK');
  });
  app.register(HttpHandlerToken, expressApp);

  const {server, request} = await startServer(app.callback());

  expect(await request('/express')).toBe('OK');
  expect(await request('/fallthrough')).toBe('hit fallthrough');
  expect(await request('/fallthrough')).toBe('hit fallthrough');
  server.close();
});
