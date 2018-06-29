/* @flow */

import test, {run} from './test-helper';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';
import {createToken} from '../create-token';
import type {Token} from '../types.js';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();
type AType = {
  a: string,
};
type BType = () => {
  b: string,
};
const TokenA: Token<AType> = createToken('TokenA');
const TokenB: Token<BType> = createToken('TokenB');
const TokenString: Token<string> = createToken('TokenString');

function delay() {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

test('async render', async t => {
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
  t.ok(ctx.element, 'sets ctx.element');
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test('sync render', async t => {
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

test('render plugin order', async t => {
  let numRenders = 0;
  const element = 'hi';
  let order = 0;
  const renderFn = el => {
    order++;
    t.equals(el, element, 'render receives correct args');
    t.equal(order, 3, 'runs render function last');
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const renderPlugin = createPlugin({
    provides: () => renderFn,
    middleware: () => (ctx, next) => {
      order++;
      t.equal(
        ctx.element,
        element,
        'sets ctx.element before running render middleware'
      );
      t.equal(order, 2, 'runs render middleware before render');
      return next();
    },
  });
  // TODO(#137): fix flow types for renderPlugin
  // $FlowFixMe
  const app = new App(element, renderPlugin);
  app.middleware((ctx, next) => {
    order++;
    t.equal(order, 1, 'runs middleware before renderer');
    return next();
  });
  const ctx = await run(app);
  t.ok(ctx.element, 'sets ctx.element');
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test('app.register - async render with async middleware', async t => {
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
  app.middleware(async (ctx, next) => {
    t.equal(ctx.element, element);
    t.equal(numRenders, 0);
    t.notok(ctx.rendered);
    await next();
    t.equal(numRenders, 1);
    t.equal(ctx.rendered, element);
  });
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test('app.register - middleware execution respects registration order', async t => {
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
  let order = 0;
  app.middleware(async (ctx, next) => {
    t.equal(order, 0, 'calls downstream in correct order');
    order++;
    t.equal(ctx.element, element);
    t.equal(numRenders, 0);
    t.notok(ctx.rendered);
    await next();
    t.equal(order, 3, 'calls upstream in correct order');
    t.equal(numRenders, 1);
    t.equal(ctx.rendered, element);
    order++;
  });
  app.middleware(async (ctx, next) => {
    t.equal(order, 1, 'calls downstream in correct order');
    order++;
    t.equal(ctx.element, element);
    t.equal(numRenders, 0);
    t.notok(ctx.rendered);
    await next();
    t.equal(order, 2, 'calls upstream in correct order');
    order++;
    t.equal(numRenders, 1);
    t.equal(ctx.rendered, element);
  });
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(order, 4, 'calls middleware in correct order');
  t.end();
});

test('app.register - middleware execution respects dependency order', async t => {
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
  let order = 0;
  app.middleware(async function first(ctx, next) {
    t.equal(order, 0, 'calls downstream in correct order');
    t.equal(numRenders, 0);
    order++;
    await next();
    t.equal(order, 7, 'calls upstream in correct order');
    t.equal(numRenders, 1);
    order++;
  });
  app.register(
    TokenA,
    createPlugin({
      deps: {TokenB},
      provides: deps => {
        t.equal(deps.TokenB().b, 'something-b');
        return {a: 'something'};
      },
      middleware: deps => {
        t.equal(deps.TokenB().b, 'something-b');
        return async function second(ctx, next) {
          t.equal(order, 2, 'calls downstream in correct order');
          t.equal(numRenders, 0);
          order++;
          await next();
          t.equal(order, 5, 'calls upstream in correct order');
          t.equal(numRenders, 1);
          order++;
        };
      },
    })
  );
  app.middleware(async function third(ctx, next) {
    t.equal(order, 3, 'calls downstream in correct order');
    t.equal(numRenders, 0);
    order++;
    await next();
    t.equal(order, 4, 'calls upstream in correct order');
    t.equal(numRenders, 1);
    order++;
  });
  app.register(
    TokenB,
    createPlugin({
      provides: () => () => ({b: 'something-b'}),
      middleware: () => {
        return async function fourth(ctx, next) {
          t.equal(order, 1, 'calls downstream in correct order');
          t.equal(numRenders, 0);
          order++;
          await next();
          t.equal(order, 6, 'calls upstream in correct order');
          t.equal(numRenders, 1);
          order++;
        };
      },
    })
  );
  const ctx = await run(app);
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render');
  t.equal(order, 8, 'calls middleware in correct order');
  t.end();
});

test('app.middleware with dependencies', async t => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  let called = false;
  app.register(TokenString, 'Something');
  app.middleware({TokenString}, deps => {
    t.equal(deps.TokenString, 'Something');
    return (ctx, next) => {
      called = true;
      return next();
    };
  });
  await run(app);
  t.ok(called, 'calls middleware');
  t.end();
});

test('app.middleware with no dependencies', async t => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  let called = false;
  app.middleware((ctx, next) => {
    called = true;
    return next();
  });
  await run(app);
  t.ok(called, 'calls middleware');
  t.end();
});

__NODE__ &&
  test('ctx.respond as false', async t => {
    const element = 'hi';
    const renderFn = el => {
      t.fail('should not render if ctx.respond is false');
      return el;
    };
    const app = new App(element, renderFn);
    app.middleware((ctx, next) => {
      ctx.respond = false;
      return next();
    });
    const ctx = await run(app);
    t.notOk(ctx.rendered, 'should not render');
    t.end();
  });
