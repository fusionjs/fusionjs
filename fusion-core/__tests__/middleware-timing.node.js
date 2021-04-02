// @flow

import {run} from './test-helper';
import {EnableMiddlewareTimingToken} from '../src/tokens';
import App from '../src/index';

test('middleware timing information is present', async done => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  app.middleware((ctx, next) => {
    return next();
  });
  app.register(EnableMiddlewareTimingToken, true);

  const ctx = await run(app);
  ctx.timing.end.then(result => {
    expect(ctx.timing.middleware.length).toBeGreaterThan(0);
    done();
  });
});

test('middleware timing information is not present', async done => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  app.middleware((ctx, next) => {
    return next();
  });

  const ctx = await run(app);
  ctx.timing.end.then(result => {
    expect(ctx.timing.middleware.length).toEqual(0);
    done();
  });
});
