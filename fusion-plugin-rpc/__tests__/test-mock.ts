/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import MockEmitter from "events";

import App, {
  createPlugin,
  createToken,
  type Token,
  type Context,
} from "fusion-core";
import { getSimulator } from "fusion-test-utils";
import { UniversalEventsToken } from "fusion-plugin-universal-events";

import { RPCHandlersToken } from "../src/tokens";
import RPCPlugin from "../src/mock";
import type { RPCServiceType, IEmitter } from "../src/types";

const MockPluginToken: Token<RPCServiceType> = createToken("test-plugin-token");
const mockCtx = {} as any as Context;
function createTestFixture() {
  const mockHandlers = {};
  const mockEmitter: IEmitter = new MockEmitter() as any;
  // $FlowFixMe
  mockEmitter.from = () => mockEmitter;
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });

  const app = new App("content", (el) => el);
  app.register(UniversalEventsToken, mockEmitterPlugin);
  app.register(RPCHandlersToken, mockHandlers);
  app.register(MockPluginToken, RPCPlugin);
  return app;
}

test("mock with missing handler", (done) => {
  const app = createTestFixture();

  expect.assertions(1);
  getSimulator(
    app,
    createPlugin({
      deps: { rpcFactory: MockPluginToken },
      provides: async (deps) => {
        const rpc = deps.rpcFactory.from(mockCtx);
        await expect(rpc.request("test")).rejects.toThrowError(
          "Missing RPC handler for test"
        );
        done();
      },
    })
  );
});

test("mock with handler", (done) => {
  const mockHandlers = {
    test: (args) => {
      expect(args).toStrictEqual({ test: "args" });
      return 10;
    },
  };

  const app = createTestFixture();
  app.register(RPCHandlersToken, mockHandlers);

  expect.assertions(2);
  getSimulator(
    app,
    createPlugin({
      deps: { rpcFactory: MockPluginToken },
      provides: async (deps) => {
        const rpc = deps.rpcFactory.from(mockCtx);

        const result = await rpc.request("test", { test: "args" });
        expect(result).toBe(10);
        done();
      },
    })
  );
});
