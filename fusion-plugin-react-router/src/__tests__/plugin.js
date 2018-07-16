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
import test from 'tape-cup';
import {Route} from '../modules/Route';
import {Redirect} from '../modules/Redirect.js';
import RouterPlugin from '../plugin';

const addRoutePrefix = (ctx, next) => {
  // hack until we have better route prefix support in fusion-test-utils
  ctx.prefix = '/test';
  return next();
};

function getApp(el) {
  const app = new App(el);
  app.register(RouterPlugin);
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
  test('server side redirects', async t => {
    const Hello = () => <div>Hello</div>;
    const element = (
      <div>
        <Redirect from="/" to="/lol" />
        <Route path="/lol" component={Hello} />
      </div>
    );
    const app = getApp(element);
    // $FlowFixMe
    app.register(UniversalEventsToken, {
      map() {},
      emit() {},
      from() {
        return {
          map() {},
          emit() {},
        };
      },
    });
    const simulator = setup(app);
    const ctx = await simulator.render('/');
    t.equal(ctx.status, 307);
    t.equal(ctx.res.getHeader('Location'), '/lol');
    cleanup();
    t.end();
  });
}

test('events with trackingId', async t => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" trackingId="home" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );
  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    t,
    title: 'home',
    page: '/',
  });
  // $FlowFixMe
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
  t.end();
});

test('events with no tracking id', async t => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    t,
    title: '/',
    page: '/',
  });
  // $FlowFixMe
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
  t.end();
});

test('events with no tracking id and route prefix', async t => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );

  const app = getPrefixApp(element);
  const UniversalEvents = getMockEvents({
    t,
    title: '/',
    page: '/',
  });
  // $FlowFixMe
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
  t.end();
});

test('events with no tracking id and deep path', async t => {
  const Hello = () => <div>Hello</div>;
  const NotHere = () => <div>NotHere</div>;
  if (__BROWSER__) {
    return t.end();
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
    t,
    title: '/user/:uuid',
    page: '/user/:uuid',
  });

  // $FlowFixMe
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  const ctx = await simulator.render('/user/abcd');

  t.ok(ctx.rendered.includes('href="/lol"'), 'sets links correctly');
  t.ok(
    ctx.rendered.includes('<div>Hello</div><div>Hello</div>'),
    'matches both user routes'
  );
  t.ok(!ctx.rendered.includes('NotHere'), 'does not match not here route');
  cleanup();
  t.end();
});

test('events with no tracking id and deep path and route prefix', async t => {
  const Hello = () => <div>Hello</div>;
  const NotHere = () => <div>NotHere</div>;
  if (__BROWSER__) {
    return t.end();
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
    t,
    title: '/user/:uuid',
    page: '/user/:uuid',
  });

  // $FlowFixMe
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  const ctx = await simulator.render('/user/abcd');
  t.ok(ctx.rendered.includes('href="/test/lol"'), 'sets links correctly');
  t.ok(
    ctx.rendered.includes('<div>Hello</div><div>Hello</div>'),
    'matches both user routes'
  );
  t.ok(!ctx.rendered.includes('NotHere'), 'does not match not here route');
  cleanup();
  t.end();
});

test('without UniversalEventsToken', async t => {
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
    t.ok(ctx.rendered.includes('<div>Hello</div>'), 'matches route');
  }
  cleanup();
  t.end();
});

if (__BROWSER__) {
  test('mapping events in browser', async t => {
    const Home = withRouter(({location, history}) => {
      if (location.pathname === '/') {
        setTimeout(() => {
          history.push('/user/');
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
          <Route path="/abcd" component={Hello} />
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
      {page: '/', title: '/'},
      {page: '/user', title: '/user'},
    ];
    let mapper;
    const UniversalEvents = createPlugin({
      provides: () => ({
        map(m) {
          mapper = m;
        },
        emit(type, payload) {
          const expected = expectedPayloads.shift();
          t.deepLooseEqual(payload, expected);
          const mapped = mapper({});
          t.equal(mapped.__url__, expected.title);
          if (expectedPayloads.length === 0) {
            cleanup();
            t.end();
          }
        },
      }),
    });

    // $FlowFixMe
    app.register(UniversalEventsToken, UniversalEvents);
    const simulator = setup(app);
    await simulator.render('/');
  });
}

function getMockEvents({t, title: expectedTitle, page: expectedPage}) {
  const expected = __NODE__
    ? ['pageview:server', 'render:server']
    : ['pageview:browser'];
  return createPlugin({
    provides: () => ({
      map(mapper) {
        t.equal(typeof mapper, 'function');
      },
      emit(type, {title, page, status, timing}) {
        t.equal(type, expected.shift(), 'emits with the correct type');
        t.equal(title, expectedTitle, 'correct title');
        t.equal(page, expectedPage, 'correct page');
        if (__NODE__) {
          t.equal(status, 200, 'emits status code');
          t.equal(typeof timing, 'number', 'emits with the correct value');
        }
      },
      from() {
        return {
          map() {},
          emit() {},
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
