/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* globals global */

import App from 'fusion-core';

import {
  getSimulator,
  createRequestContext,
  createRenderContext,
} from '../src/index.js';

test('jsdom', async () => {
  let reconfigured = false;
  global.jsdom = {
    reconfigure: ({url}) => {
      expect(url).toBe('http://localhost/test');
      reconfigured = true;
    },
  };
  const app = new App('el', () => 'hello');
  await getSimulator(app).render('/test');
  expect(reconfigured).toBe(true);
  delete global.jsdom;
});

test('jsdom with empty string', async () => {
  let reconfigured = false;
  global.jsdom = {
    reconfigure: ({url}) => {
      expect(url).toBe('http://localhost/');
      reconfigured = true;
    },
  };
  const app = new App('el', () => 'hello');
  await getSimulator(app).render('');
  expect(reconfigured).toBe(true);
  delete global.jsdom;
});

test('jsdom with /', async () => {
  let reconfigured = false;
  global.jsdom = {
    reconfigure: ({url}) => {
      expect(url).toBe('http://localhost/');
      reconfigured = true;
    },
  };
  const app = new App('el', () => 'hello');
  await getSimulator(app).render('/');
  expect(reconfigured).toBe(true);
  delete global.jsdom;
});

test('status is 404 if ctx.body is never updated', async () => {
  const app = new App('el', el => el);
  const ctx = await getSimulator(app).request('/');
  expect(ctx.status).toBe(404);
});

test('status is 200 if ctx.body is updated in request', async () => {
  const app = new App('el', el => el);
  app.middleware((ctx, next) => {
    ctx.body = {ok: 1};
    return next();
  });
  const ctx = await getSimulator(app).request('/');
  expect(ctx.status).toBe(200);
});

test('status is set if ctx.status is updated in request', async () => {
  const app = new App('el', () => 'hello');
  app.middleware((ctx, next) => {
    ctx.status = 500;
    ctx.body = {error: 'error'};
    return next();
  });
  const ctx = await getSimulator(app).render('/');
  expect(ctx.status).toBe(500);
});

test('status is 200 if ctx.body is updated in render', async () => {
  const app = new App('el', () => 'hello');
  const ctx = await getSimulator(app).render('/');
  expect(ctx.status).toBe(200);
});

test('status is set if ctx.status is updated in render', async () => {
  const app = new App('el', () => 'hello');
  app.middleware((ctx, next) => {
    ctx.status = 500;
    return next();
  });
  const ctx = await getSimulator(app).render('/');
  expect(ctx.status).toBe(500);
});

test('simulator accepts extra headers', async () => {
  const app = new App('hi', () => {});
  const simulator = getSimulator(app);

  const ctx = await simulator.render('/', {
    headers: {
      'x-header': 'value',
    },
  });

  expect(ctx.request.headers['x-header']).toBe('value');
});

test('body contains some message', async () => {
  const app = new App('el', () => 'hello');
  const ctx = await getSimulator(app).request('/_errors', {
    body: {message: 'test'},
  });
  expect(ctx.status).toBe(404);
  expect(ctx.request.body).toEqual({message: 'test'});
});

test('createRequestContext', () => {
  expect(createRequestContext('/').url).toBe('/');
  expect(createRequestContext('/test').url).toBe('/test');
  expect(createRequestContext('/', {method: 'POST'}).method).toBe('POST');
  expect(
    createRequestContext('/', {headers: {test: 'test'}}).headers.test
  ).toBe('test');
  expect(createRequestContext('/', {body: 'test'}).request.body).toBe('test');
});

test('createRenderContext', () => {
  expect(createRenderContext('/').url).toBe('/');
  expect(createRenderContext('/test').url).toBe('/test');
  expect(createRenderContext('/', {method: 'POST'}).method).toBe('POST');
  expect(createRenderContext('/', {headers: {test: 'test'}}).headers.test).toBe(
    'test'
  );
  expect(
    createRenderContext('/', {headers: {test: 'test'}}).headers.accept
  ).toBe('text/html');
  expect(createRenderContext('/').headers.accept).toBe('text/html');
  expect(createRenderContext('/', {body: 'test'}).request.body).toBe('test');
});
