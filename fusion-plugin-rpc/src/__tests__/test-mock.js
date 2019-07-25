/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import MockEmitter from 'events';

import App, {
  createPlugin,
  createToken,
  type Token,
  type Context,
} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {RPCHandlersToken} from '../tokens';
import RPCPlugin from '../mock';
import type {RPCServiceType, IEmitter} from '../types.js';

const MockPluginToken: Token<RPCServiceType> = createToken('test-plugin-token');
const mockCtx = (({}: any): Context);
function createTestFixture() {
  const mockHandlers = {};
  const mockEmitter: IEmitter = (new MockEmitter(): any);
  // $FlowFixMe
  mockEmitter.from = () => mockEmitter;
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  const app = new App('content', el => el);
  app.register(UniversalEventsToken, mockEmitterPlugin);
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
        const rpc = deps.rpcFactory.from(mockCtx);
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
        const rpc = deps.rpcFactory.from(mockCtx);

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
