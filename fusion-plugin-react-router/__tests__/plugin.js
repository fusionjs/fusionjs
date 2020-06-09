/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin} from 'fusion-core';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import {withRouter, Link} from 'react-router-dom';
import type {FusionPlugin} from 'fusion-core';
import {Route} from '../src/modules/Route';
import {Redirect} from '../src/modules/Redirect.js';
import RouterPlugin, {
  RouterProviderToken,
  RouterToken,
  GetStaticContextToken,
} from '../src/plugin';

const addRoutePrefix = (ctx, next) => {
  // hack until we have better route prefix support in fusion-test-utils
  ctx.prefix = '/test';
  return next();
};

function getApp(el) {
  const app = new App(el);
  app.register(RouterToken, RouterPlugin);
  return app;
}

function getPrefixApp(el) {
  const app = new App(el);
  app.middleware(addRoutePrefix);
  app.register(RouterPlugin);
  return app;
}

function cleanup() {
  if (__BROWSER__) {
    const root = document.getElementById('root');
    if (root && document.body) {
      document.body.removeChild(root);
    }
    const routerData = document.getElementById('__ROUTER_DATA__');
    if (routerData && document.body) {
      document.body.removeChild(routerData);
    }
  }
}

if (__NODE__) {
  test('server side redirects', async () => {
    const Hello = () => <div>Hello</div>;
    const element = (
      <div>
        <Redirect from="/" to="/lol" />
        <Route path="/lol" component={Hello} />
      </div>
    );
    const app = getApp(element);
    const emitter: FusionPlugin<any, any> = createPlugin({
      provides: () => ({
        map() {},
        emit() {},
        from() {
          return {
            map() {},
            emit() {},
          };
        },
      }),
    });
    app.register(UniversalEventsToken, emitter);
    const simulator = setup(app);
    const ctx = await simulator.render('/');
    expect(ctx.status).toBe(307);
    expect(ctx.res.getHeader('Location')).toBe('/lol');
    cleanup();
  });

  test('custom context', async () => {
    const Hello = () => <div>Hello</div>;
    const element = (
      <div>
        <Redirect from="/" to="/lol" />
        <Route path="/test" component={Hello} />
      </div>
    );
    const app = getApp(element);
    app.register(GetStaticContextToken, ctx => {
      return {
        set status(code) {
          expect(code).toBe(307);
          ctx.status = 302;
        },
        set url(url) {
          expect(url).toBe('/lol');
          ctx.redirect('/test');
        },
      };
    });
    const emitter: FusionPlugin<any, any> = createPlugin({
      provides: () => ({
        map() {},
        emit() {},
        from() {
          return {
            map() {},
            emit() {},
          };
        },
      }),
    });
    app.register(UniversalEventsToken, emitter);
    const simulator = setup(app);
    const ctx = await simulator.render('/');
    expect(ctx.status).toBe(302);
    expect(ctx.res.getHeader('Location')).toBe('/test');
    cleanup();
  });

  test('server side redirects with prefix', async () => {
    const Hello = () => <div>Hello</div>;
    const element = (
      <div>
        <Redirect from="/" to="/lol" />
        <Route path="/lol" component={Hello} />
      </div>
    );
    const app = getPrefixApp(element);
    const simulator = setup(app);
    const ctx = await simulator.render('/');
    expect(ctx.status).toBe(307);
    expect(ctx.res.getHeader('Location')).toBe('/test/lol');
    cleanup();
  });
  test('handles url with invalid URI encoding on server', async () => {
    const Hello = () => <div>Hello</div>;
    const element = (
      <div>
        <Route path="/" component={Hello} />
      </div>
    );
    const app = getApp(element);
    const UniversalEvents = getMockEvents({
      title: 'no-matching-route',
      page: '/%C0%AE%C0%AE/',
    });
    app.register(UniversalEventsToken, UniversalEvents);
    const simulator = setup(app);
    const ctx = await simulator.render('/%C0%AE%C0%AE/');

    expect(ctx.response.status).toBe(200);
    cleanup();
  });
}

test('events with trackingId', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" trackingId="home" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );
  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    title: 'home',
    page: '/',
  });
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
});

test('events with no tracking id', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    title: '/',
    page: '/',
  });
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
});

test('no matching route', async () => {
  if (__NODE__) {
    const Hello = () => <div>Hello</div>;
    const element = (
      <div>
        <Route path="/" component={Hello} />
        <Route path="/lol" component={Hello} />
      </div>
    );

    const app = getApp(element);
    const UniversalEvents = getMockEvents({
      title: 'no-matching-route',
      page: '/haha',
    });
    app.register(UniversalEventsToken, UniversalEvents);
    const simulator = setup(app);
    await simulator.render('/haha');
    cleanup();
  }
});

test('Custom Provider', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    title: 'no-matching-route',
    page: '/',
  });
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(RouterProviderToken, () => {
    return <div id="custom-node">CUSTOM PROVIDER RESULT</div>;
  });
  const simulator = setup(app);
  const {rendered} = await simulator.render('/');
  let result;
  if (__BROWSER__) {
    const node = document.getElementById('custom-node');
    if (!node || !node.textContent) {
      throw new Error('Could not find node.');
    }
    result = node && node.textContent;
  } else {
    result = rendered;
  }

  expect(result.includes('CUSTOM PROVIDER RESULT')).toBeTruthy();
  cleanup();
});

test('Router Providing History', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    title: '/',
    page: '/',
  });
  app.register(UniversalEventsToken, UniversalEvents);
  app.middleware(
    {
      router: RouterToken,
    },
    ({router}) => (ctx, next) => {
      const {history} = router.from(ctx);
      expect(history).toBeTruthy();
      expect(typeof history.push).toBe('function');
      expect(typeof history.replace).toBe('function');
      return next();
    }
  );
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
});

test('events with no tracking id and route prefix', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );

  const app = getPrefixApp(element);
  const UniversalEvents = getMockEvents({
    title: '/',
    page: '/',
  });
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
});

test('events with no tracking id and deep path', async done => {
  const Hello = () => <div>Hello</div>;
  const NotHere = () => <div>NotHere</div>;
  if (__BROWSER__) {
    return done();
  }
  const element = (
    <div>
      <Route path="/user" component={Hello} />
      <Route path="/user/:uuid" component={Hello} />
      <Route path="/lol" component={NotHere} />
      <Link to="/lol" />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    title: '/user/:uuid',
    page: '/user/:uuid',
  });

  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  const ctx = await simulator.render('/user/abcd');

  expect(ctx.rendered.includes('href="/lol"')).toBeTruthy();
  expect(
    ctx.rendered.includes('<div>Hello</div><div>Hello</div>')
  ).toBeTruthy();
  expect(!ctx.rendered.includes('NotHere')).toBeTruthy();
  cleanup();
  done();
});

test('events with no tracking id and deep path and route prefix', async done => {
  const Hello = () => <div>Hello</div>;
  const NotHere = () => <div>NotHere</div>;
  if (__BROWSER__) {
    return done();
  }
  const element = (
    <div>
      <Route path="/user" component={Hello} />
      <Route path="/user/:uuid" component={Hello} />
      <Route path="/lol" component={NotHere} />
      <Link to="/lol" />
    </div>
  );

  const app = getPrefixApp(element);
  const UniversalEvents = getMockEvents({
    title: '/user/:uuid',
    page: '/user/:uuid',
  });

  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  const ctx = await simulator.render('/user/abcd');
  expect(ctx.rendered.includes('href="/test/lol"')).toBeTruthy();
  expect(
    ctx.rendered.includes('<div>Hello</div><div>Hello</div>')
  ).toBeTruthy();
  expect(!ctx.rendered.includes('NotHere')).toBeTruthy();
  cleanup();
  done();
});

test('without UniversalEventsToken', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" trackingId="home" component={Hello} />
    </div>
  );
  const app = getApp(element);
  const simulator = setup(app);
  const ctx = await simulator.render('/');
  if (__NODE__) {
    expect(ctx.rendered.includes('<div>Hello</div>')).toBeTruthy();
  }
  cleanup();
});

if (__BROWSER__) {
  test('mapping events in browser', async done => {
    const Home = withRouter(({location, history}) => {
      if (location.pathname === '/') {
        setTimeout(() => {
          history.push('/user/1234');
        }, 50);
      }
      // add some nested routes
      return (
        <div>
          <Route path="/" component={Hello} />
        </div>
      );
    });
    const User = () => {
      // add some nested routes
      return (
        <div>
          <Route path="/" component={Hello} />
          <Route path="/user/:uuid" component={Hello} />
        </div>
      );
    };
    const Hello = () => {
      return <div>Hello</div>;
    };
    const element = (
      <div>
        <Route path="/" component={Home} />
        <Route path="/user" component={User} />
      </div>
    );
    const app = getApp(element);
    const expectedPayloads = [
      {page: '/', params: {}, title: '/', routeMatched: true},
      {
        page: '/user/:uuid',
        params: {uuid: '1234'},
        title: '/user/:uuid',
        routeMatched: true,
      },
    ];
    let mapper;
    const UniversalEvents: FusionPlugin<any, any> = createPlugin({
      provides: () => ({
        map(m) {
          mapper = m;
        },
        emit(type, payload) {
          const expected = expectedPayloads.shift();
          expect(payload).toStrictEqual(expected);
          const mapped = mapper({});
          expect(mapped.__url__).toBe(expected.title);
          expect(mapped.__urlParams__).toEqual(expected.params);
          if (expectedPayloads.length === 0) {
            cleanup();
            done();
          }
        },
      }),
    });

    app.register(UniversalEventsToken, UniversalEvents);
    const simulator = setup(app);
    await simulator.render('/');
  });
  test('handles url with invalid URI encoding in browser', async () => {
    const Hello = () => <div>Hello</div>;
    const element = (
      <div>
        <Route path="/" component={Hello} />
      </div>
    );
    const app = getApp(element);
    const UniversalEvents = getMockEvents({
      title: 'no-matching-route',
      page: '/%C0%AE%C0%AE/',
    });
    app.register(UniversalEventsToken, UniversalEvents);
    const simulator = setup(app);
    await simulator.render('/%C0%AE%C0%AE/');

    const node = document.getElementById('root');
    if (!node || !node.textContent) {
      throw new Error('Could not find node.');
    }
    expect(node && node.textContent).toBe('Hello');
    cleanup();
  });
}

function getMockEvents({
  title: expectedTitle,
  page: expectedPage,
}): FusionPlugin<any, any> {
  const expected = __NODE__
    ? ['pageview:server', 'render:server']
    : ['pageview:browser'];
  return createPlugin({
    provides: () => ({
      map(mapper) {
        expect(typeof mapper).toBe('function');
      },
      emit(type, {title, page}) {
        if (__NODE__) {
          throw new Error('fail');
        }
        expect(type).toBe(expected.shift());
        expect(title).toBe(expectedTitle);
        expect(page).toBe(expectedPage);
      },
      from(ctx) {
        expect(ctx).toBeTruthy();
        return {
          map() {},
          emit(type, {title, page, status, timing}) {
            expect(type).toBe(expected.shift());
            expect(title).toBe(expectedTitle);
            expect(page).toBe(expectedPage);
            expect(status).toBe(200);
            expect(typeof timing).toBe('number');
          },
        };
      },
    }),
  });
}

function setup(app, pageData = {title: '/', page: '/'}) {
  if (__BROWSER__) {
    const el = document.createElement('script');
    el.setAttribute('type', 'application/json');
    el.setAttribute('id', '__ROUTER_DATA__');
    const textNode = document.createTextNode(JSON.stringify(pageData));
    el.appendChild(textNode);
    document.body && document.body.appendChild(el);
    const rootEl = document.createElement('div');
    rootEl.setAttribute('id', 'root');
    document.body && document.body.appendChild(rootEl);
  }
  const simulator = getSimulator(app);
  return simulator;
}
