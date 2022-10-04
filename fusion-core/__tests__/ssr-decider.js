// @noflow

import {run} from './test-helper';
import App, {
  createPlugin,
  unstable_EnableServerStreamingToken,
  SSRDeciderToken,
} from '../src/index';

test('ssrDecider works', async (done) => {
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);

  const CustomPlugin = createPlugin({
    deps: {
      ssrDecider: SSRDeciderToken,
    },
    middleware: (deps) => async (ctx, next) => {
      ctx.fullSSRValue = deps.ssrDecider(ctx);
      return next();
    },
  });

  app.register(CustomPlugin);

  const ctx = await run(app, {
    method: 'GET',
    headers: {
      accept: 'text/html',
    },
    path: '/',
  });
  expect(ctx.fullSSRValue).toBe(true);
  done();
});

test('ssrDecider returns `stream` when streaming', async (done) => {
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);

  const CustomPlugin = createPlugin({
    deps: {
      ssrDecider: SSRDeciderToken,
    },
    middleware: (deps) => async (ctx, next) => {
      ctx.fullSSRValue = deps.ssrDecider(ctx);
      return next();
    },
  });

  app.register(CustomPlugin);
  app.register(unstable_EnableServerStreamingToken, true);
  const ctx = await run(app, {
    method: 'GET',
    headers: {
      accept: 'text/html',
    },
    path: '/',
  });
  expect(ctx.fullSSRValue).toBe('stream');

  done();
});

test('ssrDecider returns true when bot even if token is true', async (done) => {
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);

  const CustomPlugin = createPlugin({
    deps: {
      ssrDecider: SSRDeciderToken,
    },
    middleware: (deps) => async (ctx, next) => {
      ctx.fullSSRValue = deps.ssrDecider(ctx);
      return next();
    },
  });

  app.register(CustomPlugin);
  app.register(unstable_EnableServerStreamingToken, true);
  const ctx = await run(app, {
    method: 'GET',
    headers: {
      accept: 'text/html',
      'user-agent': 'bot',
    },
    path: '/',
  });
  expect(ctx.fullSSRValue).toBe(true);

  done();
});
