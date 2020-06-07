/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import http from 'http';
import App from 'fusion-core';
import request from 'request';
import reqPromise from 'request-promise';
import express from 'express';
import getPort from 'get-port';
import {HttpHandlerToken} from '../src/tokens.js';
import HttpHandlerPlugin from '../src/server.js';

test('http handler with express', async () => {
  const app = new App('test', () => 'test');
  const port = await getPort();
  // $FlowFixMe
  const proxyServer = http.createServer((req, res) => res.end('Proxy OK'));
  const port2 = await getPort();
  await new Promise(resolve => proxyServer.listen(port, resolve));
  app.middleware(async (ctx, next) => {
    await next();
    expect(ctx.respond).toBe(false);
  });
  app.register(HttpHandlerPlugin);
  const expressApp = express();
  expressApp.get('/proxy', (req, res) => {
    request(`http://localhost:${port}`).pipe(res);
  });
  app.register(HttpHandlerToken, expressApp);

  // $FlowFixMe
  const server = http.createServer(app.callback());
  await new Promise(resolve => server.listen(port2, resolve));

  expect(await reqPromise(`http://localhost:${port2}/proxy`)).toBe('Proxy OK');

  server.close();
  proxyServer.close();
});
