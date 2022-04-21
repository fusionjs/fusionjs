/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import serverApp from './server-app';
import clientApp from './client-app';
import getEnv from './get-env.js';

export default __BROWSER__ ? clientApp() : serverApp();

export {compose} from './compose';
export {memoize} from './memoize';

// sanitization API
export {
  html,
  dangerouslySetHTML,
  consumeSanitizedHTML,
  escape,
  unescape,
} from './sanitization';

// Virtual modules
export {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
  workerUrl,
} from './virtual/index.js';

export {
  RenderToken,
  ElementToken,
  SSRDeciderToken,
  HttpServerToken,
  SSRBodyTemplateToken,
  RoutePrefixToken,
  CriticalChunkIdsToken,
  RouteTagsToken,
  EnableMiddlewareTimingToken,
} from './tokens';
export {createPlugin} from './create-plugin';
export {createToken} from './create-token';
export {getEnv};
export {
  withUniversalValue,
  withRenderSetup,
  withSSREffect,
  withEndpoint,
  withMiddleware,
  withUniversalMiddleware,
} from './core.js';
