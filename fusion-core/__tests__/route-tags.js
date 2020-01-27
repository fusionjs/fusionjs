// @flow

import ClientAppFactory from '../src/client-app';
import ServerAppFactory from '../src/server-app';
import {run} from './test-helper';
import {RouteTagsToken} from '../src/tokens';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('timing plugin', async () => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  expect.assertions(4);
  app.middleware(
    {RouteTags: RouteTagsToken},
    ({RouteTags}) => async (ctx, next) => {
      const tags = RouteTags.from(ctx);
      expect(tags.name).toBe('unknown_route');
      await next();
      expect(tags.name).toBe('test');
      expect(tags.test).toBe('something');
    }
  );

  app.middleware({RouteTags: RouteTagsToken}, ({RouteTags}) => (ctx, next) => {
    const tags = RouteTags.from(ctx);
    expect(tags.name).toBe('unknown_route');
    tags.name = 'test';
    tags.test = 'something';
    return next();
  });
  await run(app);
});
