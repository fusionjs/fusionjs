// @flow

import test from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {run} from './test-helper';
import {TimingToken} from '../plugins/timing';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('timing plugin', async t => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  app.middleware({timing: TimingToken}, deps => (ctx, next) => {
    t.equal(deps.timing.from(ctx), deps.timing.from(ctx), 'timing is memoized');
    return next();
  });
  const ctx = await run(app);
  t.equal(typeof ctx.timing.start, 'number', 'sets up ctx.timing.start');
  t.ok(
    ctx.timing.end instanceof Promise,
    'sets up ctx.timing.end to be a promise'
  );
  ctx.timing.downstream.then(result => {
    t.equal(typeof result, 'number', 'sets downstream timing result');
  });
  ctx.timing.render.then(result => {
    t.equal(typeof result, 'number', 'sets render timing result');
  });
  ctx.timing.upstream.then(result => {
    t.equal(typeof result, 'number', 'sets upstream timing result');
  });
  ctx.timing.end.then(result => {
    t.equal(typeof result, 'number', 'sets end timing result');
    t.end();
  });
});
