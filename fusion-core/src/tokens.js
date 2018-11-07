/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from './create-token';
import type {SSRDecider, SSRBodyTemplate, Token, Context} from './types.js';

// $FlowFixMe - Update type for flow 0.85
export const RenderToken = createToken('RenderToken');
// $FlowFixMe - Update type for flow 0.85
export const ElementToken = createToken('ElementToken');
export const SSRDeciderToken: Token<SSRDecider> = createToken(
  'SSRDeciderToken'
);
// $FlowFixMe - Update type for flow 0.85
export const HttpServerToken = createToken('HttpServerToken');
export const SSRBodyTemplateToken: Token<SSRBodyTemplate> = createToken(
  'SSRBodyTemplateToken'
);
export const RoutePrefixToken: Token<string> = createToken('RoutePrefixToken');

export type CriticalChunkIds = Set<number>;

export type CriticalChunkIdsService = {
  from(ctx: Context): CriticalChunkIds,
};

export const CriticalChunkIdsToken: Token<
  CriticalChunkIdsService
> = createToken('CriticalChunkIdsToken');
