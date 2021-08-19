/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {Token} from 'fusion-core';

declare const HttpHandlerToken: Token<ServiceType>;
declare const HttpHandlerConfigToken: Token<ConfigType>;

declare type DepsType = {
  handler: typeof HttpHandlerToken;
};
declare type ServiceType = (
  c: unknown,
  b: unknown,
  a: (error?: any) => Promise<any>
) => void;
declare type ConfigType = {
  defer: boolean;
};

declare const plugin: fusion_core.FusionPlugin<DepsType, void>;

export {HttpHandlerConfigToken, HttpHandlerToken, plugin as default};
