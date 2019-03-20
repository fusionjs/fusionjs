/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App from '../index';
import {compose} from '../compose.js';

import type {Context} from '../types.js';

test('context composition', async t => {
  const element = 'hello';
  const render = el => `<h1>${el}</h1>`;
  const wrap = (ctx, next) => {
    ctx.element = ctx.element.toUpperCase();
    return next();
  };
  const chunkUrlMap = new Map();
  const chunkIdZero = new Map();
  chunkIdZero.set('es5', 'es5-file.js');
  chunkUrlMap.set(0, chunkIdZero);
  const context = {
    method: 'GET',
    headers: {accept: 'text/html'},
    path: '/',
    syncChunks: [0],
    preloadChunks: [],
    chunkUrlMap,
    webpackPublicPath: '/',
    element: null,
    rendered: null,
    render: null,
    type: null,
    body: null,
  };

  const app = new App(element, render);
  app.middleware(wrap);
  try {
    app.resolve();
    const middleware = compose(app.plugins);
    // $FlowFixMe
    await middleware(context, () => Promise.resolve());
    // $FlowFixMe
    t.equals(typeof context.rendered, 'string', 'renders');
    // $FlowFixMe
    t.ok(context.rendered.includes('<h1>HELLO</h1>'), 'has expected html');
  } catch (e) {
    t.ifError(e, 'something went wrong');
  }
  t.end();
});

test('context composition with a cdn', async t => {
  const element = 'hello';
  const render = el => `<h1>${el}</h1>`;
  const wrap = () => (ctx: Context, next: () => Promise<void>) => {
    ctx.element = ctx.element.toUpperCase();
    return next();
  };
  const chunkUrlMap = new Map();
  const chunkIdZero = new Map();
  chunkIdZero.set('es5', 'es5-file.js');
  chunkUrlMap.set(0, chunkIdZero);
  const context = {
    method: 'GET',
    headers: {accept: 'text/html'},
    path: '/',
    syncChunks: [0],
    preloadChunks: [],
    chunkUrlMap,
    webpackPublicPath: 'https://something.com/lol',
    element: null,
    rendered: null,
    render: null,
    type: null,
    body: null,
  };

  const app = new App(element, render);
  app.middleware(wrap());
  app.resolve();
  const middleware = compose(app.plugins);
  try {
    await middleware(((context: any): Context), () => Promise.resolve());
    // $FlowFixMe
    t.ok(context.body.includes('https://something.com/lol/es5-file.js'));
  } catch (e) {
    t.ifError(e, 'something went wrong');
  }
  t.end();
});
