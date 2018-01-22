/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'tape-cup';

import App, {createPlugin} from 'fusion-core';
import {FetchToken, createToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';

import {RPCHandlersToken} from '../tokens';
import RPCPlugin from '../browser';

const MockPluginToken = createToken('test-plugin-token');
function createTestFixture() {
  const mockFetch = (...args) =>
    Promise.resolve({json: () => ({status: 'success', data: args})});
  const mockHandlers = {};

  const app = new App('content', el => el);
  app.register(FetchToken, mockFetch);
  app.register(RPCHandlersToken, mockHandlers);
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

test('failure status request', t => {
  const mockFetchAsFailure = () =>
    Promise.resolve({json: () => ({status: 'failure', data: 'failure data'})});

  const app = createTestFixture();
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
