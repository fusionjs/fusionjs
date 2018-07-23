/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';

import App, {createPlugin, createToken} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import RPCPlugin from '../browser';

const MockPluginToken = createToken('test-plugin-token');
function createTestFixture() {
  const mockFetch = (...args) =>
    Promise.resolve({json: () => ({status: 'success', data: args})});

  const app = new App('content', el => el);
  // $FlowFixMe
  app.register(FetchToken, mockFetch);
  app.register(MockPluginToken, RPCPlugin);
  return app;
}

test('success status request', t => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from();
        t.equals(typeof rpc.request, 'function', 'has method');
        t.ok(rpc.request('test') instanceof Promise, 'has right return type');
        rpc
          .request('test')
          .then(([url, options]) => {
            t.equals(url, '/api/test', 'has right url');
            t.equals(options.method, 'POST', 'has right http method');
            t.equals(
              options.headers['Content-Type'],
              'application/json',
              'has right content-type'
            );
            t.equals(options.body, '{}', 'has right body');
          })
          .catch(e => {
            t.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  t.true(wasResolved, 'plugin was resolved');
  t.end();
});

test('success status request w/args and header', t => {
  const app = createTestFixture();

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from();
        t.equals(typeof rpc.request, 'function', 'has method');
        t.ok(rpc.request('test') instanceof Promise, 'has right return type');
        rpc
          .request('test', {args: 1}, {'test-header': 'header value'})
          .then(([url, options]) => {
            t.equals(url, '/api/test', 'has right url');
            t.equals(options.method, 'POST', 'has right http method');
            t.equals(
              options.headers['Content-Type'],
              'application/json',
              'has right content-type'
            );
            t.equals(
              options.headers['test-header'],
              'header value',
              'header is passed'
            );
            t.equals(options.body, '{"args":1}', 'has right body');
          })
          .catch(e => {
            t.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  t.true(wasResolved, 'plugin was resolved');
  t.end();
});

test('failure status request', t => {
  const mockFetchAsFailure = () =>
    Promise.resolve({json: () => ({status: 'failure', data: 'failure data'})});

  const app = createTestFixture();
  // $FlowFixMe
  app.register(FetchToken, mockFetchAsFailure);

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from();
        t.equals(typeof rpc.request, 'function', 'has method');
        const testRequest = rpc.request('test');
        t.ok(testRequest instanceof Promise, 'has right return type');
        testRequest
          .then(() => {
            // $FlowFixMe
            t.fail(() => new Error('should reject promise'));
          })
          .catch(e => {
            t.equal(e, 'failure data', 'should pass failure data through');
          });

        wasResolved = true;
      },
    })
  );

  t.true(wasResolved, 'plugin was resolved');
  t.end();
});
