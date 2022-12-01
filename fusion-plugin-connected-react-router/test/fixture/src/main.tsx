/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ts-nocheck
 */

import React from "react";
import { createPlugin } from "fusion-core";
import { compose } from "redux";
import App from "fusion-react";
import Root from "./root";
import Router, {
  RouterToken,
  RouterProviderToken,
} from "fusion-plugin-react-router";
import Redux, {
  ReduxToken,
  ReducerToken,
  EnhancerToken,
  GetInitialStateToken,
} from "fusion-plugin-react-redux";
import ConnectedRouterEnhancer, {
  ConnectedRouterEnhancerToken,
} from "../../..";
import { ConnectedRouter } from "connected-react-router";
import reducer from "./redux";

export default function start() {
  const app = new App(<Root />);

  app.register(ReduxToken, Redux);
  app.register(ReducerToken, reducer);
  __NODE__ &&
    app.register(GetInitialStateToken, async (ctx) => ({
      user: {},
    }));

  app.register(RouterToken, Router);
  app.register(RouterProviderToken, ConnectedRouter);
  app.register(ConnectedRouterEnhancerToken, ConnectedRouterEnhancer);

  app.register(
    EnhancerToken,
    createPlugin({
      deps: { connectedRouterEnhancer: ConnectedRouterEnhancerToken },
      provides: ({ connectedRouterEnhancer }) => {
        return compose(connectedRouterEnhancer);
      },
    })
  );

  return app;
}
