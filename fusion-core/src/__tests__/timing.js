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

test('timing plugin on error middleware', async t => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  let resolved = {
    downstream: false,
    upstream: false,
    render: false,
  };
  app.middleware((ctx, next) => {
    ctx.timing.downstream.then(result => {
      resolved.downstream = true;
    });
    ctx.timing.render.then(result => {
      resolved.render = true;
    });
    ctx.timing.upstream.then(result => {
      resolved.upstream = true;
    });
    ctx.timing.end.then(result => {
      t.equal(typeof result, 'number', 'sets end timing result');
      t.equal(resolved.downstream, false, 'does not resolve downstream');
      t.equal(resolved.render, false, 'does not resolve render');
      t.equal(resolved.upstream, false, 'does not resolve upstream');
      t.equal(ctx.status, 500, 'sets ctx.status');
      t.end();
    });
    return next();
  });
  app.middleware((ctx, next) => {
    const e = new Error('fail request');
    // $FlowFixMe
    e.status = 500;
    throw e;
  });
  await run(app).catch(e => {});
});
