/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import App from '../src/index';
import {compose} from '../src/compose.js';

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
    middleware(context, () => Promise.resolve())
  ).resolves.not.toThrow();
  expect(typeof context.rendered).toBe('string');
  expect(context.rendered.includes('<h1>HELLO</h1>')).toBeTruthy();
});

test('context composition with a cdn', async () => {
  const element = 'hello';
  const render = (el) => `<h1>${el}</h1>`;
  const wrap = () => (ctx, next) => {
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
    middleware(context, () => Promise.resolve())
  ).resolves.not.toThrow();
  expect(
    context.body.includes('https://something.com/lol/es5-file.js')
  ).toBeTruthy();
});

test('prepare boundary works', async () => {
  const element = 'hello';
  const render = (el) => `<h1>${el}</h1>`;

  const app = new App(element, render);

  let done = false;
  app.prepareBoundary.addEffect(() => {
    done = true;
  });
  app.prepareBoundary.done();
  expect(done).toEqual(true);
});
