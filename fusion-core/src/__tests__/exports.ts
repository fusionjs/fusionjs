/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
} from '../index';

test('fusion-core api', () => {
  expect(App).toBeTruthy();
  if (__NODE__) {
    expect(html).toBeTruthy();
    expect(dangerouslySetHTML).toBeTruthy();
    expect(consumeSanitizedHTML).toBeTruthy();
    expect(escape).toBeTruthy();
  } else {
    expect(html).toBeFalsy();
    expect(dangerouslySetHTML).toBeFalsy();
    expect(consumeSanitizedHTML).toBeFalsy();
    expect(escape).toBeFalsy();
  }
  expect(unescape).toBeTruthy();
  expect(compose).toBeTruthy();
  expect(memoize).toBeTruthy();
  expect(assetUrl).toBeTruthy();
  expect(workerUrl).toBeTruthy();
  expect(chunkId).toBeTruthy();
  expect(syncChunkIds).toBeTruthy();
  expect(syncChunkPaths).toBeTruthy();
  expect(RenderToken).toBeTruthy();
  expect(ElementToken).toBeTruthy();
  expect(SSRDeciderToken).toBeTruthy();
  expect(createPlugin).toBeTruthy();
});
