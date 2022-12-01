/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';

import type {ConfigTokenType, SWLoggerTokenType} from './types.js';

type Options = {
  cacheableRoutePatterns?: Array<RegExp>,
  cacheBustingPatterns?: Array<RegExp>,
  cacheDuration?: number,
};

export const SWLoggerToken: SWLoggerTokenType = createToken('SWLoggerToken');
export const SWRegisterToken: Token<boolean> = createToken('SWRegisterToken');
export const SWTemplateFunctionToken: ConfigTokenType = createToken(
  'SWTemplateFunctionToken'
);
export const SWOptionsToken: Token<Options> = createToken('SWOptionsToken');
