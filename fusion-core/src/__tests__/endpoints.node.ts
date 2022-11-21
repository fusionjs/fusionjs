import {run} from './test-helper';
import App, {Context, withEndpoint} from '../index';
import {declarePlugin} from '../create-plugin';

test('withEndpoint works', async () => {
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
  } as Context);
  expect(ctx.body).toBe('foobar');
});
