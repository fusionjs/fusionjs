/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';

import type {ConfigTokenType, SWLoggerTokenType} from './types.js';

export const SWTemplateFunctionToken: ConfigTokenType = createToken(
  'SWTemplateFunctionToken'
);

export const SWLoggerToken: SWLoggerTokenType = createToken('SWLoggerToken');
