/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin} from 'fusion-core';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import {withRouter} from 'react-router-dom';
import test from 'tape-cup';
import {Route} from '../modules/Route';
import RouterPlugin from '../plugin';

function getApp(el) {
  const app = new App(el);
  app.register(RouterPlugin);
  return app;
}

function cleanup() {
  if (__BROWSER__) {
    document.body.removeChild(document.getElementById('root'));
    document.body.removeChild(document.getElementById('__ROUTER_DATA__'));
  }
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
  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/');
  cleanup();
  t.end();
});

test('events with no tracking id and deep path', async t => {
  const Hello = () => <div>Hello</div>;
  if (__BROWSER__) {
    return t.end();
  }
  const element = (
    <div>
      <Route path="/user" component={Hello} />
      <Route path="/user/:uuid" component={Hello} />
    </div>
  );

  const app = getApp(element);
  const UniversalEvents = getMockEvents({
    t,
    title: '/user/:uuid',
    page: '/user/:uuid',
  });

  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  await simulator.render('/user/abcd');
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

    app.register(UniversalEventsToken, UniversalEvents);
    const simulator = setup(app);
    await simulator.render('/');
  });
}

function getMockEvents({t, title: expectedTitle, page: expectedPage}) {
  const expected = __NODE__
    ? ['render:server', 'pageview:server']
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
    document.body.appendChild(el);
    const rootEl = document.createElement('div');
    rootEl.setAttribute('id', 'root');
    document.body.appendChild(rootEl);
  }
  const simulator = getSimulator(app);
  return simulator;
}
