/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App from '../src/index';
import {compose} from '../src/compose.js';

import type {Context} from '../src/types.js';

test('context composition', async () => {
  const element = 'hello';
  const render = (el) => `<h1>${el}</h1>`;
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
  app.resolve();
  const middleware = compose(app.plugins);
  await expect(
    // $FlowFixMe
    middleware(context, () => Promise.resolve())
  ).resolves.not.toThrow();
  expect(typeof context.rendered).toBe('string');
  // $FlowFixMe
  expect(context.rendered.includes('<h1>HELLO</h1>')).toBeTruthy();
});

test('context composition with a cdn', async () => {
  const element = 'hello';
  const render = (el) => `<h1>${el}</h1>`;
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
  await expect(
    middleware(((context: any): Context), () => Promise.resolve())
  ).resolves.not.toThrow();
  expect(
    // $FlowFixMe
    context.body.includes('https://something.com/lol/es5-file.js')
  ).toBeTruthy();
});
