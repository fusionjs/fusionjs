/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import test from 'tape-cup';

import App, {createPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';

import CsrfPlugin from '../index';
import {CsrfExpireToken, FetchForCsrfToken} from '../shared';

/* Test helpers */
function getApp(fetchFn: Fetch) {
  const app = new App('element', el => el);
  app.register(FetchForCsrfToken, fetchFn);
  app.register(FetchToken, CsrfPlugin);
  return app;
}

function createMockFetch(responseParams: mixed): Response {
  const mockResponse = new Response();
  return {
    ...mockResponse,
    ...responseParams,
  };
}

test('exposes right methods', t => {
  const app = getApp(window.fetch);
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: ({fetch}) => {
        t.equal(typeof fetch, 'function');
        t.end();
      },
    })
  );
  app.resolve();
});

test('includes routePrefix if exists', async t => {
  window.__ROUTE_PREFIX__ = '/something';
  let called = 0;
  const expectedUrls = ['/something/csrf-token', '/something/hello'];
  const fetch = (url, args) => {
    called++;
    t.equal(url, expectedUrls.shift());
    return Promise.resolve(
      createMockFetch({
        url,
        args,
        headers: {
          get(key) {
            if (key === 'x-csrf-token') {
              return Math.round(Date.now() / 1000) + '-test';
            }
          },
        },
      })
    );
  };

  const app = getApp(fetch);
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: async ({fetch}) => {
        t.equal(typeof fetch, 'function');
        // $FlowFixMe
        const {url, args} = await fetch('/hello', {method: 'POST'});
        t.equals(called, 2, 'preflight works');
        t.equals(url, '/something/hello', 'ok url');
        t.equals(args.credentials, 'same-origin', 'ok credentials');
        t.equals(
          args.headers['x-csrf-token'].split('-')[1],
          'test',
          'ok token'
        );
        delete window.__ROUTE_PREFIX__;
        t.end();
      },
    })
  );
  app.resolve();
});

test('supports getting initial token from dom element', async t => {
  const el = document.createElement('div');
  el.setAttribute('id', '__CSRF_TOKEN__');
  el.setAttribute('type', 'application/json');
  el.textContent = JSON.stringify(
    `${Math.round(
      Date.now() / 1000
    )}-\u003C\u002Fscript\u003Etoken\u003Cscript\u003E`
  );
  document.body && document.body.appendChild(el);
  let called = 0;
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    called++;
    t.equal(url, expectedUrls.shift());
    return Promise.resolve(
      createMockFetch({
        url,
        args,
        headers: {
          get(key) {
            if (key === 'x-csrf-token') {
              return Math.round(Date.now() / 1000) + '-lol';
            }
          },
        },
      })
    );
  };

  const app = getApp(fetch);
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: async ({fetch}) => {
        // $FlowFixMe
        const {url, args} = await fetch('/hello', {method: 'POST'});
        t.equals(
          called,
          1,
          'does not preflight if deserializing token from html'
        );
        t.equals(url, '/hello', 'ok url');
        t.equals(args.credentials, 'same-origin', 'ok credentials');
        t.equals(
          args.headers['x-csrf-token'].split('-')[1],
          '</script>token<script>',
          'unescapes the token correctly'
        );
        document.body && document.body.removeChild(el);
        t.end();
      },
    })
  );
  app.resolve();
});

test('defaults method to GET', async t => {
  let called = 0;
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    called++;
    t.equal(url, expectedUrls.shift());

    return Promise.resolve(
      createMockFetch({
        url,
        args,
        headers: {
          get(key) {
            if (key === 'x-csrf-token') {
              return Math.round(Date.now() / 1000) + '-test';
            }
          },
        },
      })
    );
  };

  const app = getApp(fetch);
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: async ({fetch}) => {
        // $FlowFixMe
        const {url, args} = await fetch('/hello');
        t.equals(called, 1, 'does not preflight for GET requests');
        t.equals(url, '/hello', 'ok url');
        t.notok(
          args.headers['x-csrf-token'],
          'does not send token on GET requests'
        );
        t.end();
      },
    })
  );
  app.resolve();
});

test('fetch preflights if no token', t => {
  let called = 0;
  const fetch = (url, args) => {
    called++;
    return Promise.resolve(
      createMockFetch({
        url,
        args,
        headers: {
          get(key) {
            if (key === 'x-csrf-token') {
              return Math.round(Date.now() / 1000) + '-test';
            }
          },
        },
      })
    );
  };

  const app = getApp(fetch);
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: async ({fetch}) => {
        // $FlowFixMe
        const {url, args} = await fetch('/test', {method: 'POST'});
        t.equals(called, 2, 'preflight works');
        t.equals(url, '/test', 'ok url');
        t.equals(args.credentials, 'same-origin', 'ok credentials');
        t.equals(
          args.headers['x-csrf-token'].split('-')[1],
          'test',
          'ok token'
        );
        await fetch('/foo', {method: 'POST'});
        t.equals(called, 3, 'no preflight if token exists');
        t.end();
      },
    })
  );
  app.resolve();
});

test('fetch preflights if token is expired', t => {
  let called = 0;
  const fetch = (url, args) => {
    called++;
    return Promise.resolve(
      createMockFetch({
        url,
        args,
        headers: {
          get(key) {
            if (key === 'x-csrf-token') {
              return Math.round(Date.now() / 1000) + '-test';
            }
          },
        },
      })
    );
  };

  const app = getApp(fetch);
  app.register(CsrfExpireToken, 1);
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: async ({fetch}) => {
        // $FlowFixMe
        const {url, args} = await fetch('/test', {method: 'POST'});
        t.equals(called, 2, 'preflight works');
        t.equals(url, '/test', 'ok url');
        t.equals(args.credentials, 'same-origin', 'ok credentials');
        t.equals(
          args.headers['x-csrf-token'].split('-')[1],
          'test',
          'ok token'
        );

        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetch('/foo', {method: 'POST'});
        t.equals(called, 4, 'preflight if token expired');
        t.end();
      },
    })
  );
  app.resolve();
});
