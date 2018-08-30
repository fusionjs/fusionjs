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

test('http handler with express using send', async t => {
  const app = new App('test', () => 'test');
  app.register(HttpHandlerPlugin);
  const expressApp = express();
  expressApp.get('/express', (req, res) => {
    res.send('OK');
  });
  app.register(HttpHandlerToken, expressApp);
  app.middleware((ctx, next) => {
    if (ctx.url === '/express') {
      t.equal(ctx.res.statusCode, 200, 'express route sets status code');
    } else {
      t.equal(ctx.res.statusCode, 404, 'non express routes default to 404');
    }
    // $FlowFixMe
    ctx.req.secure = false;
    ctx.body = 'hit fallthrough';
    return next();
  });

  const {server, request} = await startServer(app.callback());

  t.equal(await request('/express'), 'OK', 'express routes can send responses');
  t.equal(
    await request('/fallthrough'),
    'hit fallthrough',
    'express routes can delegate back to koa'
  );
  t.equal(
    await request('/fallthrough'),
    'hit fallthrough',
    'express routes can delegate back to koa'
  );
  server.close();
  t.end();
});
