/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App, {
  html,
  dangerouslySetHTML,
  consumeSanitizedHTML,
  escape,
  unescape,
  compose,
  memoize,
  assetUrl,
  chunkId,
  syncChunkIds,
  syncChunkPaths,
  workerUrl,
  RenderToken,
  ElementToken,
  SSRDeciderToken,
  createPlugin,
} from '../index.js';

test('fusion-core api', t => {
  t.ok(App, 'exports App as default');
  if (__NODE__) {
    t.ok(html, 'exports html');
    t.ok(dangerouslySetHTML, 'exports dangerouslySetHTML');
    t.ok(consumeSanitizedHTML, 'exports consumeSanitizedHTML');
    t.ok(escape, 'exports escape');
  } else {
    t.notok(html, 'does not export html in the browser');
    t.notok(
      dangerouslySetHTML,
      'does not export dangerouslySetHTML in browser'
    );
    t.notok(
      consumeSanitizedHTML,
      'does not export consumeSanitizedHTML in browser'
    );
    t.notok(escape, 'does not export escape in browser');
  }
  t.ok(unescape, 'exports unescape');
  t.ok(compose, 'exports compose');
  t.ok(memoize, 'exports memoize');
  t.ok(assetUrl, 'exports assetUrl');
  t.ok(workerUrl, 'exports assetUrl');
  t.ok(chunkId, 'exports chunkId');
  t.ok(syncChunkIds, 'exports syncChunkIds');
  t.ok(syncChunkPaths, 'exports syncChunkPaths');
  t.ok(RenderToken, 'exports RenderToken');
  t.ok(ElementToken, 'exports ElementToken');
  t.ok(SSRDeciderToken, 'exports SSRDeciderToken');
  t.ok(createPlugin, 'exports createPlugin');
  t.end();
});
