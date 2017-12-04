import test from 'tape-cup';
import ClientAppFactory from '../client';
import ServerAppFactory from '../server';
import compose from '../plugin/compose';

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

function run(app) {
  const ctx = getContext();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}

function delay() {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

test(`${env} - async render`, async t => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    t.equals(el, element, 'render receives correct args');
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, renderFn);
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test(`${env} - sync render`, async t => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    numRenders++;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, renderFn);
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test(`${env} - app.plugin`, async t => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    numRenders++;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, renderFn);
  app.plugin(
    deps => {
      return async (ctx, next) => {
        t.deepLooseEqual(deps, {a: true});
        t.equal(ctx.element, element);
        t.equal(numRenders, 0);
        t.notok(ctx.rendered);
        await next();
        t.equal(numRenders, 1);
        t.equal(ctx.rendered, element);
      };
    },
    {a: true}
  );
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});
