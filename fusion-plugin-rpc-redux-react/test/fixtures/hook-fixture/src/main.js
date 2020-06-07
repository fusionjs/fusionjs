/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import App from 'fusion-react';
import RPCPlugin, {RPCToken, createRPCReducer} from '../../../..';
import Root from './root.js';
import ReduxPlugin, {ReducerToken, ReduxToken} from 'fusion-plugin-react-redux';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import {RPCHandlersToken} from 'fusion-plugin-rpc';
import {FetchToken} from 'fusion-tokens';
import {combineReducers} from 'redux';

export default () => {
  const app = new App((<Root />));

  __NODE__
    ? app.register(RPCHandlersToken, rpcHandlers)
    : app.register(FetchToken, fetch);

  app.register(RPCToken, RPCPlugin);
  app.register(UniversalEventsToken, UniversalEvents);
  app.register(ReduxToken, ReduxPlugin);
  app.register(ReducerToken, reducer);

  return app;
};

const reducer = combineReducers({
  user: createRPCReducer('getUser', {
    start: (state, action) => ({...state, loading: true}),
    success: (state, action) => ({
      ...state,
      loading: false,
      data: action.payload,
    }),
    failure: (state, action) => ({
      ...state,
      loading: false,
      error: action.payload.error,
    }),
  }),
  trip: createRPCReducer('getTrip', {
    start: (state, action) => ({...state, loading: true}),
    success: (state, action) => ({
      ...state,
      loading: false,
      data: action.payload,
    }),
    failure: (state, action) => ({
      ...state,
      loading: false,
      error: action.payload.error,
    }),
  }),
});

const rpcHandlers = {
  async getUser() {
    return {type: 'user'};
  },
  async getTrip() {
    return {type: 'trip'};
  },
};
