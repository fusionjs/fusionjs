/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Token, Context, FusionPlugin} from 'fusion-core';

declare const ErrorHandlingEmitterToken: Token<any>;

declare const ErrorHandlerToken: Token<ErrorHandlerType>;

declare type DepsType = {
  onError?: typeof ErrorHandlerToken;
  emit?: typeof ErrorHandlingEmitterToken.optional;
};
declare type ErrorHandlerPluginType = FusionPlugin<DepsType, never>;
declare type ErrorHandlerType = (
  e: Error,
  captureType: string,
  ctx?: Context | null
) => Promise<any> | void;

declare const _default: ErrorHandlerPluginType;

export {ErrorHandlerToken, _default as default};
