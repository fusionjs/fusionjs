// @flow

import {RouterToken} from 'fusion-plugin-react-router';

import type {FusionPlugin} from 'fusion-core';
import type {StoreEnhancer} from 'redux';

export type ConnectedRouterDepsType = {
  router: typeof RouterToken,
};

export type ConnectedRouterPluginType = FusionPlugin<
  ConnectedRouterDepsType,
  StoreEnhancer<*, *, *>
>;
