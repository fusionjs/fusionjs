/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env browser, node */

import React from 'react';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin} from 'fusion-core';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import type {FusionPlugin} from 'fusion-core';
import {Link, Routes, Route, Outlet} from '../src/index.js';
import {Navigate} from '../src/modules/Navigate.js';
import RouterPlugin, {RouterToken, GetStaticContextToken} from '../src/plugin';

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
        <Navigate to="/lol" />
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="/lol" element={<Hello />} />
        </Routes>
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
        <Navigate to="/lol" />
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="/lol" element={<Hello />} />
          <Route path="/test" element={<Hello />} />
        </Routes>
      </div>
    );
    const app = getApp(element);
    app.register(GetStaticContextToken, (ctx) => {
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
        <Navigate to="/lol" />
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="/test" element={<Hello />} />
          <Route path="/test/lol" element={<Hello />} />
        </Routes>
      </div>
    );
    const app = getPrefixApp(element);
    const simulator = setup(app);
    const ctx = await simulator.render('/test');
    expect(ctx.status).toBe(307);
    expect(ctx.res.getHeader('Location')).toBe('/test/lol');
    cleanup();
  });
  test('handles url with invalid URI encoding on server', async () => {
    const Hello = () => <div>Hello</div>;
    const element = (
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
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
    <Routes>
      <Route path="/" trackingId="home" element={<Hello />} />
      <Route path="/lol" element={<Hello />} />
    </Routes>
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

test('events with no tracking id base', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <Routes>
      <Route path="/" element={<Hello />} />
      <Route path="/lol" element={<Hello />} />
    </Routes>
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
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="/lol" element={<Hello />} />
        </Routes>
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

test('Router Providing History', async () => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/lol" element={<Hello />} />
      </Routes>
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
    ({router}) =>
      (ctx, next) => {
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
    <Routes>
      <Route path="/" element={<Hello />} />
      <Route path="/lol" element={<Hello />} />
    </Routes>
  );

  const app = getPrefixApp(element);
  const UniversalEvents = getMockEvents({
    title: '/',
    page: '/',
  });
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/test');
  cleanup();
});

test('events with no tracking id and deep path', async (done) => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hello = () => <div>Hello</div>;
  const NotHere = () => <div>NotHere</div>;
  if (__BROWSER__) {
    return done();
  }
  const element = (
    <div>
      <Routes>
        <Route path="/user" element={<HelloParent />}>
          <Route path=":uuid" element={<Hello />} />
        </Route>
        <Route path="/lol" element={<NotHere />} />
      </Routes>
      <Link to="/lol" />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    title: '/user/abcd',
    page: '/user/abcd',
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

test('events with tracking id and deep path', async (done) => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hello = () => <div>Hello</div>;
  const NotHere = () => <div>NotHere</div>;
  if (__BROWSER__) {
    return done();
  }
  const element = (
    <div>
      <Routes>
        <Route path="/user" element={<HelloParent />}>
          <Route
            path=":uuid"
            element={<Hello />}
            trackingId={'deep-tracking'}
          />
        </Route>
        <Route path="/lol" element={<NotHere />} />
      </Routes>
      <Link to="/lol" />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    title: 'deep-tracking',
    page: '/user/abcd',
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

test('events with no tracking id and deep path and route prefix', async (done) => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hello = () => <div>Hello</div>;
  const NotHere = () => <div>NotHere</div>;
  if (__BROWSER__) {
    return done();
  }
  const element = (
    <div>
      <Routes>
        <Route path="/user" element={<HelloParent />}>
          <Route path=":uuid" element={<Hello />} />
        </Route>
        <Route path="/lol" element={<NotHere />} />
      </Routes>
      <Link to="/lol" />
    </div>
  );

  const app = getPrefixApp(element);
  const UniversalEvents = getMockEvents({
    title: '/user/abcd',
    page: '/user/abcd',
  });

  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  const ctx = await simulator.render('/test/user/abcd');
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
    <Routes>
      <Route path="/" trackingId="home" element={<Hello />} />
    </Routes>
  );
  const app = getApp(element);
  const simulator = setup(app);
  const ctx = await simulator.render('/');
  if (__NODE__) {
    expect(ctx.rendered.includes('<div>Hello</div>')).toBeTruthy();
  }
  cleanup();
});

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

function setupRouterData(pageData = {title: '/', page: '/'}) {
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

function setup(app, pageData = {title: '/', page: '/'}) {
  if (__BROWSER__) {
    setupRouterData(pageData);
  }
  const simulator = getSimulator(app);
  return simulator;
}
