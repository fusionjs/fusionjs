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
