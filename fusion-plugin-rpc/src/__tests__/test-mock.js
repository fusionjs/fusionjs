/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';

import App, {createPlugin, createToken} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import {RPCHandlersToken} from '../tokens';
import RPCPlugin from '../mock';

const MockPluginToken = createToken('test-plugin-token');
function createTestFixture() {
  const mockHandlers = {};

  const app = new App('content', el => el);
  app.register(RPCHandlersToken, mockHandlers);
  app.register(MockPluginToken, RPCPlugin);
  return app;
}

test('mock with missing handler', async t => {
  const app = createTestFixture();

  t.plan(1);
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: async deps => {
        const rpc = deps.rpcFactory.from();
        try {
          await rpc.request('test');
        } catch (e) {
          t.equal(e.message, 'Missing RPC handler for test');
        } finally {
          t.end();
        }
      },
    })
  );
});

test('mock with handler', async t => {
  const mockHandlers = {
    test: args => {
      t.deepLooseEqual(args, {test: 'args'}, 'correct args provded');
      return 10;
    },
  };

  const app = createTestFixture();
  app.register(RPCHandlersToken, mockHandlers);

  t.plan(2);
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: async deps => {
        const rpc = deps.rpcFactory.from();

        try {
          const result = await rpc.request('test', {test: 'args'});
          t.equal(result, 10, 'correct request result');
        } catch (e) {
          t.ifError(e);
        } finally {
          t.end();
        }
      },
    })
  );
});
