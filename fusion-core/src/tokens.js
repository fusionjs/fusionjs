/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from './create-token';
import type {
  RenderType,
  SSRDecider,
  SSRBodyTemplate,
  Context,
  RouteTagsType,
} from './types.js';
import type {Server} from 'http';

export const RouteTagsToken = createToken<RouteTagsType>('RouteTagsToken');
export const RenderToken = createToken<RenderType>('RenderToken');
export const ElementToken = createToken<any>('ElementToken');
export const SSRDeciderToken = createToken<SSRDecider>('SSRDeciderToken');
export const HttpServerToken = createToken<Server>('HttpServerToken');
export const SSRBodyTemplateToken = createToken<SSRBodyTemplate>(
  'SSRBodyTemplateToken'
);
export const RoutePrefixToken = createToken<string>('RoutePrefixToken');

export type CriticalChunkIds = Set<number>;

export type CriticalChunkIdsService = {
  from(ctx: Context): CriticalChunkIds,
};

export const CriticalChunkIdsToken = createToken<CriticalChunkIdsService>(
  'CriticalChunkIdsToken'
);

export const EnableMiddlewareTimingToken = createToken<boolean>(
  'EnableMiddlewareTimingToken'
);
