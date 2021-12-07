// @noflow

import ClientAppFactory from '../src/client-app';
import ServerAppFactory from '../src/server-app';
import {run} from './test-helper';
import {TimingToken} from '../src/plugins/timing';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('timing plugin', async (done) => {
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);
  app.middleware({timing: TimingToken}, (deps) => (ctx, next) => {
    expect(deps.timing.from(ctx)).toBe(deps.timing.from(ctx));
    return next();
  });
  const ctx = await run(app);
  expect(typeof ctx.timing.start).toBe('number');
  expect(ctx.timing.end instanceof Promise).toBeTruthy();
  ctx.timing.downstream.then((result) => {
    expect(typeof result).toBe('number');
  });
  ctx.timing.render.then((result) => {
    expect(typeof result).toBe('number');
  });
  ctx.timing.upstream.then((result) => {
    expect(typeof result).toBe('number');
  });
  ctx.timing.end.then((result) => {
    expect(typeof result).toBe('number');
    done();
  });
});

test('timing plugin on error middleware', async (done) => {
  const element = 'hi';
  const renderFn = (el) => {
    return el;
  };
  const app = new App(element, renderFn);
  let resolved = {
    downstream: false,
    upstream: false,
    render: false,
  };
  app.middleware((ctx, next) => {
    ctx.timing.downstream.then((result) => {
      resolved.downstream = true;
    });
    ctx.timing.render.then((result) => {
      resolved.render = true;
    });
    ctx.timing.upstream.then((result) => {
      resolved.upstream = true;
    });
    ctx.timing.end.then((result) => {
      expect(typeof result).toBe('number');
      expect(resolved.downstream).toBe(false);
      expect(resolved.render).toBe(false);
      expect(resolved.upstream).toBe(false);
      expect(ctx.status).toBe(500);
      done();
    });
    return next();
  });
  app.middleware((ctx, next) => {
    const e = new Error('fail request');
    e.status = 500;
    throw e;
  });
  await run(app).catch((e) => {});
});
