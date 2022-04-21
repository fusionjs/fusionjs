// @noflow

import {run} from './test-helper';
import App, {withEndpoint} from '../src/index';
import {declarePlugin} from '../src/create-plugin';

test('withEndpoint works', async (done) => {
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);

  const EndpointPlugin = declarePlugin(
    // eslint-disable-next-line require-yield
    function* MyPlugin() {
      withEndpoint('/_foobar', (ctx, next) => {
        ctx.body = 'foobar';
        return next();
      });
    }
  );

  app.register(EndpointPlugin);

  const ctx = await run(app, {
    method: 'GET',
    path: '/_foobar',
    headers: {
      accept: 'text/html',
    },
  });
  expect(ctx.body).toBe('foobar');
  done();
});
