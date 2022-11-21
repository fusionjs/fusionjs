import {run} from './test-helper';
import App, {
  createPlugin,
  unstable_EnableServerStreamingToken,
  SSRDeciderToken,
  Context,
} from '../index';

test('ssrDecider works', async () => {
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
  } as Context);
  expect(ctx.fullSSRValue).toBe(true);
});

test('ssrDecider returns `stream` when streaming', async () => {
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
  } as Context);
  expect(ctx.fullSSRValue).toBe('stream');
});

test('ssrDecider returns true when bot even if token is true', async () => {
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
  } as Context);
  expect(ctx.fullSSRValue).toBe(true);
});
