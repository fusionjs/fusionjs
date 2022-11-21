/* eslint-disable jest/valid-expect-in-promise */

import {run} from './test-helper';
import {EnableMiddlewareTimingToken} from '../tokens';
import App, {createPlugin, createToken} from '../index';

test('middleware timing information is present', async () => {
  expect.assertions(1);
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);
  app.middleware((ctx, next) => {
    return next();
  });
  app.register(EnableMiddlewareTimingToken, true);

  const ctx = await run(app);
  ctx.timing.end.then((result) => {
    expect(ctx.timing.middleware.length).toBeGreaterThan(0);
  });
});

test('middleware timing information is not present', async () => {
  expect.assertions(1);
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);
  app.middleware((ctx, next) => {
    return next();
  });

  const ctx = await run(app);
  ctx.timing.end.then((result) => {
    expect(ctx.timing.middleware.length).toEqual(0);
  });
});

test('Enhancer middleware timing', async () => {
  expect.assertions(1);
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);
  app.register(EnableMiddlewareTimingToken, true);

  const FooToken = createToken('Foo');
  app.register(
    FooToken,
    createPlugin({
      middleware: () => (ctx, next) => {
        return next();
      },
    })
  );

  app.enhance(FooToken, () =>
    createPlugin({
      middleware: () => (ctx, next) => {
        return next();
      },
    })
  );

  const ctx = await run(app);
  ctx.timing.end.then((result) => {
    expect(ctx.timing.middleware.length).toBeGreaterThan(0);
  });
});
