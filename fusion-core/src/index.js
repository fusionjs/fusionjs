/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import serverApp from './server';
import clientApp from './client';

import {Plugin, SingletonPlugin, compose} from './plugin/index.js';

import {
  html,
  dangerouslySetHTML,
  consumeSanitizedHTML,
  escape,
  unescape,
} from './sanitization';

export default (__BROWSER__ ? clientApp() : serverApp());
// sanitization API
export {html, dangerouslySetHTML, consumeSanitizedHTML, escape, unescape};

export {Plugin, SingletonPlugin, compose};

// Virtual modules
export {
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
} from './virtual/index.js';
