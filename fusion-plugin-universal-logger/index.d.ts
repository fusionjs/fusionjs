/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Token, FusionPlugin} from 'fusion-core';
import {Logger} from 'fusion-tokens';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {LoggerOptions} from 'winston';

declare const UniversalLoggerConfigToken: Token<LoggerOptions>;

declare type DepsType = {
  emitter: typeof UniversalEventsToken;
  config?: typeof UniversalLoggerConfigToken.optional;
};
declare type UniversalLoggerPluginType = FusionPlugin<DepsType, Logger>;

declare const _default: UniversalLoggerPluginType;

export {UniversalLoggerConfigToken, _default as default};
