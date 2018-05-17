/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';

import {fonts as mockFonts} from './fixtures/static/font-config';
import {
  fallbackLookup as expectedFallbackLookup,
  fontFaces as expectedFontFaces,
  preloadLinks as expectedPreloadLinks,
} from './fixtures/expected';

import generateFallbackMap from '../generate-fallback-map';
import generateFontFaces from '../generate-font-faces';
import generatePreloadLinks from '../generate-preload-links';

tape('generateFallbackMap', t => {
  t.equal(
    typeof generateFallbackMap,
    'function',
    'exports a generateFallbackMap function'
  );
  t.deepEqual(generateFallbackMap(mockFonts, 0), expectedFallbackLookup.depth0);
  t.deepEqual(generateFallbackMap(mockFonts, 1), expectedFallbackLookup.depth1);
  t.deepEqual(generateFallbackMap(mockFonts, 2), expectedFallbackLookup.depth2);
  t.end();
});

tape('generateFontFaces', t => {
  t.equal(
    typeof generateFontFaces,
    'function',
    'exports a generateFontFaces function'
  );
  t.equal(generateFontFaces(mockFonts), expectedFontFaces);
  t.end();
});

tape('generatePreloadLinks', t => {
  t.equal(
    typeof generatePreloadLinks,
    'function',
    'exports a generatePreloadLinks function'
  );
  t.equal(
    generatePreloadLinks({'Lato-Regular': true}, mockFonts),
    expectedPreloadLinks
  );
  t.end();
});
