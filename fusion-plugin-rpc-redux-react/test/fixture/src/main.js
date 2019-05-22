// @noflow

import React from 'react';
import App from 'fusion-react';
import RPCPlugin, {
  createRPCReducer,
  withRPCRedux,
  withRPCReactor,
  mock as RPCPluginMock,
  RPCToken,
} from '../../..';
import Root from './root.js';
import {createPlugin} from 'fusion-core';
import ReduxPlugin, {ReducerToken, ReduxToken} from 'fusion-plugin-react-redux';
import UniversalEvents, {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {RPCHandlersToken} from 'fusion-plugin-rpc';
import {FetchToken} from 'fusion-tokens';
import rpcHandlers from './rpc/index.js';
import reducer from './redux.js';

export default () => {
  const app = new App(<Root />);

  __NODE__
    ? app.register(RPCHandlersToken, rpcHandlers)
    : app.register(FetchToken, fetch);

  app.register(RPCToken, RPCPlugin);
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(ReduxToken, ReduxPlugin);
  app.register(ReducerToken, reducer);
  /*
  app.register(createPlugin({
    deps: {events: UniversalEventsToken},
    provides() {},
    middleware({events}) {
      return (ctx, next) => {
        switch(ctx.request.url) {
          case '/actions':
            ctx.body = [];
            break;
        }
        return next();
      };
    },
  }));
  */
  return app;
};

