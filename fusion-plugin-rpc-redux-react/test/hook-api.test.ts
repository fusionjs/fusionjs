/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 */

/* eslint-env node */
import React from "react";
import App from "fusion-react";
import { getSimulator } from "fusion-test-utils";
import Redux, { ReduxToken, ReducerToken } from "fusion-plugin-react-redux";
import { createMockEmitter } from "./utils";
import { UniversalEventsToken } from "fusion-plugin-universal-events";

import Plugin, { RPCToken, RPCHandlersToken, useRPCRedux } from "..";

test("useRPCRedux hook API", async () => {
  expect.assertions(4);

  let done;
  // Control when the test should exit
  const testPromise = new Promise((resolve) => (done = resolve));

  function Root() {
    const getUser = useRPCRedux("getUser", {
      mapStateToParams: (state, arg) => ({
        ...arg,
        ...state,
        mappedValue: "map",
      }),
      transformParams: (arg) => ({
        ...arg,
        transformedValue: "transform",
      }),
    });
    expect(typeof getUser).toBe("function"); // handler is a function

    const result = getUser({ initialValue: "initial" });
    expect(result).toBeInstanceOf(Promise); // handler returns promise

    // eslint-disable-next-line
    result.then((data) => {
      expect(data).toBeTruthy(); // data resolves
      expect(data).toEqual({
        initialValue: "initial",
        stateValue: "state",
        mappedValue: "map",
        transformedValue: "transform",
      }); // plumbing functions (mapStateToParams, transformParams) are all called
      done(); // exit test
    });
  }

  const app = new App(React.createElement(Root), (el) => el);
  app.register(RPCToken, Plugin);
  app.register(ReduxToken, Redux);
  app.register(UniversalEventsToken, createMockEmitter());
  app.register(RPCHandlersToken, {
    getUser(value) {
      return value;
    },
  });
  app.register(ReducerToken, (state) => ({
    stateValue: "state",
  }));
  const sim = getSimulator(app);
  await sim.render("/");
  return testPromise;
});
