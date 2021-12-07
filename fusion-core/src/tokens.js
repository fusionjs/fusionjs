/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {createToken} from './create-token';

export const RouteTagsToken = createToken('RouteTagsToken');
export const RenderToken = createToken('RenderToken');
export const ElementToken = createToken('ElementToken');
export const SSRDeciderToken = createToken('SSRDeciderToken');
export const HttpServerToken = createToken('HttpServerToken');
export const SSRBodyTemplateToken = createToken('SSRBodyTemplateToken');
export const RoutePrefixToken = createToken('RoutePrefixToken');

export const CriticalChunkIdsToken = createToken('CriticalChunkIdsToken');

export const EnableMiddlewareTimingToken = createToken(
  'EnableMiddlewareTimingToken'
);
