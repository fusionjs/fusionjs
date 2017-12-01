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
  let numRenders = 0;
  const element = 'hi';
  const render = el => {
    t.equals(el, element, 'render receives correct args');
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, render);
  const ctx = await app.simulate(getContext());
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test(`${env} - simulate with sync render`, async t => {
  let numRenders = 0;
  const element = 'hi';
  const render = el => {
    numRenders++;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);
  const ctx = await app.simulate(getContext());
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test(`${env} - app.plugin`, async t => {
  let numRenders = 0;
  const element = 'hi';
  const render = el => {
    numRenders++;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);
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
  const ctx = await app.simulate(getContext());
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});
