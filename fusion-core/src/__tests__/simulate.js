import test from 'tape-cup';
import ClientAppFactory from '../client';
import ServerAppFactory from '../server';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();
const env = __BROWSER__ ? 'browser' : 'server';

function getContext() {
  return __BROWSER__
    ? {}
    : {
        path: '/',
        headers: {
          accept: 'text/html',
        },
      };
}

function delay() {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

test(`${env} - simulate with async render`, async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = el => {
    t.equals(el, element, 'render receives correct args');
    return delay().then(() => {
      flags.render = true;
      return el;
    });
  };
  const app = new App(element, render);
  const ctx = await app.simulate(getContext());
  t.equal(ctx.rendered, element);
  t.ok(flags.render, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test(`${env} - simulate with sync render`, async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = el => {
    flags.render = true;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);
  const ctx = await app.simulate(getContext());
  t.equal(ctx.rendered, element);
  t.ok(flags.render, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test(`${env} - app.plugin`, async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = el => {
    flags.render = true;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);
  app.plugin(
    deps => {
      return async (ctx, next) => {
        t.deepLooseEqual(deps, {a: true});
        t.equal(ctx.element, element);
        t.notok(flags.render);
        t.notok(ctx.rendered);
        await next();
        t.ok(flags.render);
        t.equal(ctx.rendered, element);
      };
    },
    {a: true}
  );
  const ctx = await app.simulate(getContext());
  t.equal(ctx.rendered, element);
  t.ok(flags.render, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});
