/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type {
  ExtractTokenType,
  ExtractDepsType,
  Context,
  FusionPlugin,
  FusionPluginDepsType,
  Middleware,
  Token,
  SSRBodyTemplate,
  RenderType as Render,
  RouteTagsType,
} from './types';

import BaseApp from './base-app';
import serverApp from './server-app';
import clientApp from './client-app';
import getEnv from './get-env';

interface FusionApp extends BaseApp {}
const FusionApp: typeof BaseApp = __BROWSER__ ? clientApp() : serverApp();
export default FusionApp;

export {compose} from './compose';
export {memoize} from './memoize';
export type {MemoizeFn} from './memoize';

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
} from './virtual/index';

export {
  RenderToken,
  ElementToken,
  SSRDeciderToken,
  HttpServerToken,
  SSRBodyTemplateToken,
  SSRShellTemplateToken,
  RoutePrefixToken,
  CriticalChunkIdsToken,
  RouteTagsToken,
  EnableMiddlewareTimingToken,
  unstable_EnableServerStreamingToken,
} from './tokens';
export {createPlugin} from './create-plugin';
export {createToken} from './create-token';
export {getEnv};
export {
  withUniversalValue,
  withRenderSetup,
  unstable_withPrepareEffect,
  withEndpoint,
  withMiddleware,
  withUniversalMiddleware,
} from './core';

export type {
  Context,
  FusionApp,
  FusionPlugin,
  FusionPluginDepsType,
  Middleware,
  Token,
  SSRBodyTemplate,
  Render,
  RouteTagsType,
  ExtractDepsType,
  ExtractTokenType,
};
