/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import 'whatwg-fetch';

import App, {createPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';

import CsrfPlugin from '../src/index';

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

test('exposes right methods', done => {
  const app = getApp(window.fetch);
  app.register(
    createPlugin({
      deps: {fetch: FetchToken},
      provides: ({fetch}) => {
        expect(typeof fetch).toBe('function');
        done();
      },
    })
  );
  app.resolve();
});

test('includes routePrefix if exists', async done => {
  window.__ROUTE_PREFIX__ = '/something';
  const fetch = (url, args) => {
    expect(url).toBe('/something/hello');
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
        expect(typeof fetch).toBe('function');
        // $FlowFixMe
        const {url, args} = await fetch('/hello', {method: 'POST'});
        expect(url).toBe('/something/hello');
        expect(args.credentials).toBe('same-origin');
        expect(args.headers['x-csrf-token']).toBe('x');
        delete window.__ROUTE_PREFIX__;
        done();
      },
    })
  );
  app.resolve();
});

test('sends token on POST', async done => {
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    expect(url).toBe(expectedUrls.shift());
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
        expect(url).toBe('/hello');
        expect(args.credentials).toBe('same-origin');
        expect(args.headers['x-csrf-token']).toBe('x');
        done();
      },
    })
  );
  app.resolve();
});

test('defaults method to GET', async done => {
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    expect(url).toBe(expectedUrls.shift());
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
        expect(url).toBe('/hello');
        expect(args.headers).toBeFalsy();
        done();
      },
    })
  );
  app.resolve();
});
