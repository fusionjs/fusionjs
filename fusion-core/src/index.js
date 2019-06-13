/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {
  Context,
  FusionPlugin,
  Middleware,
  Token,
  SSRBodyTemplate,
  RenderType as Render,
} from './types.js';

import BaseApp from './base-app';
import serverApp from './server-app';
import clientApp from './client-app';
import getEnv from './get-env.js';

export default __BROWSER__ ? clientApp() : serverApp();

export {compose} from './compose.js';
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
} from './tokens';
export {createPlugin} from './create-plugin';
export {createToken} from './create-token';
export {getEnv};

type FusionApp = typeof BaseApp;
declare export default typeof BaseApp;
export type {
  Context,
  FusionApp,
  FusionPlugin,
  Middleware,
  Token,
  SSRBodyTemplate,
  Render,
};
