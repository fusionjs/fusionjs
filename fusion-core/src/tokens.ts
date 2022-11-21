/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createToken} from './create-token';
import type {
  RenderType,
  SSRDecider,
  SSRBodyTemplate,
  SSRShellTemplate,
  Context,
  RouteTagsType,
  unstable_EnableServerStreamingTokenType,
} from './types';
import type {Server} from 'http';

export const RouteTagsToken = createToken<RouteTagsType>('RouteTagsToken');
export const RenderToken = createToken<RenderType>('RenderToken');
export const ElementToken = createToken<any>('ElementToken');
export const SSRDeciderToken = createToken<SSRDecider>('SSRDeciderToken');
export const HttpServerToken = createToken<Server>('HttpServerToken');
export const SSRBodyTemplateToken = createToken<SSRBodyTemplate>(
  'SSRBodyTemplateToken'
);
export const SSRShellTemplateToken = createToken<SSRShellTemplate>(
  'SSRShellTemplateToken'
);
export const RoutePrefixToken = createToken<string>('RoutePrefixToken');
export const unstable_EnableServerStreamingToken =
  createToken<unstable_EnableServerStreamingTokenType>(
    'unstable_EnableServerStreamingToken'
  );

export type CriticalChunkIds = Set<number>;

export type CriticalChunkIdsService = {
  from(ctx: Context): CriticalChunkIds;
};

export const CriticalChunkIdsToken = createToken<CriticalChunkIdsService>(
  'CriticalChunkIdsToken'
);

export const EnableMiddlewareTimingToken = createToken<boolean>(
  'EnableMiddlewareTimingToken'
);
