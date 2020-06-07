/* @flow */

import {run} from './test-helper';
import ClientAppFactory from '../src/client-app';
import ServerAppFactory from '../src/server-app';
import {createPlugin} from '../src/create-plugin';
import {createToken} from '../src/create-token';
import type {Token} from '../src/types.js';

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

test('async render', async () => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    expect(el).toBe(element);
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, renderFn);
  const ctx = await run(app);
  expect(ctx.element).toBeTruthy();
  expect(ctx.rendered).toBe(element);
  expect(numRenders).toBe(1);
  expect(ctx.element).toBe(element);
});

test('sync render', async () => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    numRenders++;
    expect(el).toBe(element);
    return el;
  };
  const app = new App(element, renderFn);
  const ctx = await run(app);
  expect(ctx.rendered).toBe(element);
  expect(numRenders).toBe(1);
  expect(ctx.element).toBe(element);
});

test('render plugin order', async () => {
  let numRenders = 0;
  const element = 'hi';
  let order = 0;
  const renderFn = el => {
    order++;
    expect(el).toBe(element);
    expect(order).toBe(3);
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const renderPlugin = createPlugin({
    provides: () => renderFn,
    middleware: () => (ctx, next) => {
      order++;
      expect(ctx.element).toBe(element);
      expect(order).toBe(2);
      return next();
    },
  });
  // TODO(#137): fix flow types for renderPlugin
  // $FlowFixMe
  const app = new App(element, renderPlugin);
  app.middleware((ctx, next) => {
    order++;
    expect(order).toBe(1);
    return next();
  });
  const ctx = await run(app);
  expect(ctx.element).toBeTruthy();
  expect(ctx.rendered).toBe(element);
  expect(numRenders).toBe(1);
  expect(ctx.element).toBe(element);
});

test('app.register - async render with async middleware', async () => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    expect(el).toBe(element);
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, renderFn);
  app.middleware(async (ctx, next) => {
    expect(ctx.element).toBe(element);
    expect(numRenders).toBe(0);
    expect(ctx.rendered).toBeFalsy();
    await next();
    expect(numRenders).toBe(1);
    expect(ctx.rendered).toBe(element);
  });
  const ctx = await run(app);
  expect(ctx.rendered).toBe(element);
  expect(numRenders).toBe(1);
  expect(ctx.element).toBe(element);
});

test('app.register - middleware execution respects registration order', async () => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    expect(el).toBe(element);
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, renderFn);
  let order = 0;
  app.middleware(async (ctx, next) => {
    expect(order).toBe(0);
    order++;
    expect(ctx.element).toBe(element);
    expect(numRenders).toBe(0);
    expect(ctx.rendered).toBeFalsy();
    await next();
    expect(order).toBe(3);
    expect(numRenders).toBe(1);
    expect(ctx.rendered).toBe(element);
    order++;
  });
  app.middleware(async (ctx, next) => {
    expect(order).toBe(1);
    order++;
    expect(ctx.element).toBe(element);
    expect(numRenders).toBe(0);
    expect(ctx.rendered).toBeFalsy();
    await next();
    expect(order).toBe(2);
    order++;
    expect(numRenders).toBe(1);
    expect(ctx.rendered).toBe(element);
  });
  const ctx = await run(app);
  expect(ctx.rendered).toBe(element);
  expect(numRenders).toBe(1);
  expect(order).toBe(4);
});

test('app.register - middleware execution respects dependency order', async () => {
  let numRenders = 0;
  const element = 'hi';
  const renderFn = el => {
    expect(el).toBe(element);
    return delay().then(() => {
      numRenders++;
      return el;
    });
  };
  const app = new App(element, renderFn);
  let order = 0;
  app.middleware(async function first(ctx, next) {
    expect(order).toBe(0);
    expect(numRenders).toBe(0);
    order++;
    await next();
    expect(order).toBe(7);
    expect(numRenders).toBe(1);
    order++;
  });
  app.register(
    TokenA,
    createPlugin({
      deps: {TokenB},
      provides: deps => {
        expect(deps.TokenB().b).toBe('something-b');
        return {a: 'something'};
      },
      middleware: deps => {
        expect(deps.TokenB().b).toBe('something-b');
        return async function second(ctx, next) {
          expect(order).toBe(2);
          expect(numRenders).toBe(0);
          order++;
          await next();
          expect(order).toBe(5);
          expect(numRenders).toBe(1);
          order++;
        };
      },
    })
  );
  app.middleware(async function third(ctx, next) {
    expect(order).toBe(3);
    expect(numRenders).toBe(0);
    order++;
    await next();
    expect(order).toBe(4);
    expect(numRenders).toBe(1);
    order++;
  });
  app.register(
    TokenB,
    createPlugin({
      provides: () => () => ({b: 'something-b'}),
      middleware: () => {
        return async function fourth(ctx, next) {
          expect(order).toBe(1);
          expect(numRenders).toBe(0);
          order++;
          await next();
          expect(order).toBe(6);
          expect(numRenders).toBe(1);
          order++;
        };
      },
    })
  );
  const ctx = await run(app);
  expect(ctx.rendered).toBe(element);
  expect(numRenders).toBe(1);
  expect(order).toBe(8);
});

test('app.middleware with dependencies', async () => {
  const element = 'hi';
  const renderFn = el => {
    return el;
  };
  const app = new App(element, renderFn);
  let called = false;
  app.register(TokenString, 'Something');
  app.middleware({TokenString}, deps => {
    expect(deps.TokenString).toBe('Something');
    return (ctx, next) => {
      called = true;
      return next();
    };
  });
  await run(app);
  expect(called).toBeTruthy();
});

test('app.middleware with no dependencies', async () => {
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
  expect(called).toBeTruthy();
});

__NODE__ &&
  test('ctx.respond as false', async () => {
    const element = 'hi';

    const renderFn = jest.fn();

    const app = new App(element, renderFn);
    app.middleware((ctx, next) => {
      ctx.respond = false;
      return next();
    });
    const ctx = await run(app);
    expect(renderFn).not.toHaveBeenCalled();
    expect(ctx.rendered).toBeFalsy();
  });
