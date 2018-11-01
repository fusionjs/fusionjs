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

/* Test helpers */
function getApp(fetchFn: Fetch) {
  const app = new App('element', el => el);
  app.register(FetchToken, fetchFn);
  app.enhance(FetchToken, CsrfPlugin);
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
  const fetch = (url, args) => {
    t.equal(url, '/something/hello');
    return Promise.resolve(
      createMockFetch({
        url,
        args,
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
        t.equals(url, '/something/hello', 'ok url');
        t.equals(args.credentials, 'same-origin', 'ok credentials');
        t.equals(args.headers['x-csrf-token'], 'x', 'sends token');
        delete window.__ROUTE_PREFIX__;
        t.end();
      },
    })
  );
  app.resolve();
});

test('sends token on POST', async t => {
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    t.equal(url, expectedUrls.shift());
    return Promise.resolve(
      createMockFetch({
        url,
        args,
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
        t.equals(url, '/hello', 'ok url');
        t.equals(args.credentials, 'same-origin', 'ok credentials');
        t.equal(args.headers['x-csrf-token'], 'x');
        t.end();
      },
    })
  );
  app.resolve();
});

test('defaults method to GET', async t => {
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    t.equal(url, expectedUrls.shift());
    return Promise.resolve(
      createMockFetch({
        url,
        args,
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
        t.equals(url, '/hello', 'ok url');
        t.notok(args.headers, 'does not send token on GET requests');
        t.end();
      },
    })
  );
  app.resolve();
});
