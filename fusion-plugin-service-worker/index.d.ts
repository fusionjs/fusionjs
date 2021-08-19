/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {Token} from 'fusion-core';

declare type AssetInfo = {
  precachePaths: Array<RequestInfo>;
  cacheableResourcePaths: Array<RequestInfo>;
  cacheableRoutePatternStrings: Array<string>;
  cacheBustingPatternStrings: Array<string>;
  cacheDuration?: number;
};
declare type ConfigType = (a: AssetInfo) => string;
declare type ConfigTokenType = Token<ConfigType>;
declare type SWLoggerType = {
  readonly log: (...data: Array<string>) => void;
};
declare type SWLoggerTokenType = Token<SWLoggerType>;

declare type InstallEvent = any;
declare type FetchEvent = any;
declare function getHandlers(assetInfo: AssetInfo): {
  onInstall: (event: InstallEvent) => void;
  onActivate: (event: InstallEvent) => void;
  onFetch: (event: FetchEvent) => Promise<void>;
};

declare type Options = {
  cacheableRoutePatterns?: Array<RegExp>;
  cacheBustingPatterns?: Array<RegExp>;
  cacheDuration?: number;
};
declare const SWLoggerToken: SWLoggerTokenType;
declare const SWRegisterToken: Token<boolean>;
declare const SWTemplateFunctionToken: ConfigTokenType;
declare const SWOptionsToken: Token<Options>;

declare const _default: fusion_core.FusionPlugin<{}, void>;

export {
  AssetInfo,
  SWLoggerToken,
  SWOptionsToken,
  SWRegisterToken,
  SWTemplateFunctionToken,
  _default as default,
  getHandlers,
};
