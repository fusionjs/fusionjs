/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env browser */

import React from 'react';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin} from 'fusion-core';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import type {FusionPlugin} from 'fusion-core';
import {Routes, Route} from '../src/index.js';
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

test('handles url with invalid URI encoding in browser', async () => {
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
  await simulator.render('/%C0%AE%C0%AE/');

  const node = document.getElementById('root');
  if (!node || !node.textContent) {
    throw new Error('Could not find node.');
  }
  expect(node && node.textContent).toBe('Hello');
  cleanup();
});

function getMockEvents({
  title: expectedTitle,
  page: expectedPage,
}): FusionPlugin<any, any> {
  const expected = ['pageview:browser'];
  return createPlugin({
    provides: () => ({
      map(mapper) {
        expect(typeof mapper).toBe('function');
      },
      emit(type, {title, page}) {
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
  setupRouterData(pageData);
  const simulator = getSimulator(app);
  return simulator;
}
