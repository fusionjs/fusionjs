/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {RouterToken} from 'fusion-plugin-react-router';
import {FusionPlugin, Token} from 'fusion-core';
import {StoreEnhancer} from 'redux';

declare type ConnectedRouterDepsType = {
  router: typeof RouterToken;
};
declare type ConnectedRouterPluginType = FusionPlugin<
  ConnectedRouterDepsType,
  StoreEnhancer<any, any>
>;

declare const ConnectedRouterEnhancerToken: Token<StoreEnhancer<any, any>>;

declare const plugin: ConnectedRouterPluginType;

export {ConnectedRouterEnhancerToken, plugin as default};
