/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/* eslint-env browser */

import React, {useEffect} from 'react';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin} from 'fusion-core';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import type {FusionPlugin} from 'fusion-core';
import {Routes, Route, useLocation, useNavigate} from '../src/index';
import RouterPlugin, {RouterToken} from '../src/plugin';

function getApp(el) {
  const app = new App(el);
  app.register(RouterToken, RouterPlugin);
  return app;
}

function cleanup() {
  const root = document.getElementById('root');
  if (root && document.body) {
    document.body.removeChild(root);
  }
  const routerData = document.getElementById('__ROUTER_DATA__');
  if (routerData && document.body) {
    document.body.removeChild(routerData);
  }
}

test('mapping events in browser', async () => {
  const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
      if (location.pathname === '/') {
        navigate('/user/1234', {replace: false});
      }
    });
    // add some nested routes
    return (
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    );
  };
  const User = () => {
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
      if (location.pathname === '/user/1234') {
        navigate('/12345', {replace: false});
      }
    });
    // add some nested routes
    return (
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/:uuid" element={<Hello />} />
      </Routes>
    );
  };
  const Hello = () => {
    return <div>Hello</div>;
  };
  const element = (
    <Routes>
      <Route path="/*" element={<Home />} />
      <Route path="/user/*" element={<User />} />
    </Routes>
  );
  const app = getApp(element);
  const expectedPayloads = [
    {page: '/', params: {}, title: '/', routeMatched: true},
    {page: '/', params: {'*': ''}, title: '/', routeMatched: true},
    {
      page: '/user/1234',
      params: {'*': '1234'},
      title: '/user/1234',
      routeMatched: true,
    },
    {
      page: '/12345',
      params: {'*': '12345'},
      title: '/12345',
      routeMatched: true,
    },
  ];
  // eslint-disable-next-line no-unused-vars
  let mapper;
  const UniversalEvents: FusionPlugin<any, any> = createPlugin({
    provides: () => ({
      map(m) {
        mapper = m;
      },
      emit(type, payload) {
        const expected = expectedPayloads.shift();
        expect(payload).toStrictEqual(expected);
        if (expectedPayloads.length === 0) {
          cleanup();
        }
      },
    }),
  });

  app.register(UniversalEventsToken, UniversalEvents);
  const simulator = setup(app);
  // Render 4 times for the initial render + 3 useEffects
  await simulator.render('/');
  await simulator.render('/');
  await simulator.render('/');
  await simulator.render('/');
});

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
  setupRouterData(pageData);
  const simulator = getSimulator(app);
  return simulator;
}
