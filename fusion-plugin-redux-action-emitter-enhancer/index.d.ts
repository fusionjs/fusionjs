/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {StoreEnhancer} from 'redux';
import {Token, FusionPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

declare const ActionEmitterTransformerToken: Token<Function>;
declare type PluginDepsType = {
  emitter: typeof UniversalEventsToken;
  transformer: typeof ActionEmitterTransformerToken.optional;
};
declare type ServiceType = StoreEnhancer<any, any>;
declare const plugin: FusionPlugin<PluginDepsType, ServiceType>;

export {ActionEmitterTransformerToken, plugin as default};
