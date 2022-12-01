/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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
