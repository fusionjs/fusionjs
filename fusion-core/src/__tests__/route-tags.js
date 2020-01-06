// @flow

import test from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {run} from './test-helper';
import {RouteTagsToken} from '../tokens';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('timing plugin', async t => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  t.plan(4);
  app.middleware(
    {RouteTags: RouteTagsToken},
    ({RouteTags}) => async (ctx, next) => {
      const tags = RouteTags.from(ctx);
      t.equal(tags.name, 'unknown_route');
      await next();
      t.equal(tags.name, 'test');
      t.equal(tags.test, 'something');
    }
  );

  app.middleware({RouteTags: RouteTagsToken}, ({RouteTags}) => (ctx, next) => {
    const tags = RouteTags.from(ctx);
    t.equal(tags.name, 'unknown_route');
    tags.name = 'test';
    tags.test = 'something';
    return next();
  });
  await run(app);
  t.end();
});
