/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';

import {getFontConfig} from './fixtures/static/font-config';
import {
  fallbackLookup as expectedFallbackLookup,
  atomicFontFaces as expectedAtomicFontFaces,
  styledFontFaces as expectedStyledFontFaces,
  preloadLinks as expectedPreloadLinks,
} from './fixtures/expected';

import generateFallbackMap from '../generate-fallback-map';
import {
  generateAtomicFontFaces,
  generateStyledFontFaces,
} from '../generate-font-faces';
import type {AtomicFontsObjectType, StyledFontsObjectType} from '../types';
import generatePreloadLinks from '../generate-preload-links';

tape('generateFallbackMap with atomic config', t => {
  const atomicFonts: AtomicFontsObjectType = (getFontConfig(false).fonts: any);
  t.deepEqual(
    generateFallbackMap(atomicFonts, 0),
    expectedFallbackLookup.depth0
  );
  t.deepEqual(
    generateFallbackMap(atomicFonts, 1),
    expectedFallbackLookup.depth1
  );
  t.deepEqual(
    generateFallbackMap(atomicFonts, 2),
    expectedFallbackLookup.depth2
  );
  t.end();
});

tape('generateAtomicFontFaces', t => {
  const atomicFonts: AtomicFontsObjectType = (getFontConfig(false).fonts: any);
  equalWithoutSpaces(
    t,
    generateAtomicFontFaces(atomicFonts),
    expectedAtomicFontFaces
  );
  t.end();
});

tape('generateStyledFontFaces', t => {
  const styledFonts: StyledFontsObjectType = (getFontConfig(true).fonts: any);
  equalWithoutSpaces(
    t,
    generateStyledFontFaces(styledFonts),
    expectedStyledFontFaces
  );
  t.end();
});

tape('generatePreloadLinks', t => {
  const atomicFonts: AtomicFontsObjectType = (getFontConfig(false).fonts: any);
  t.equal(
    generatePreloadLinks({'Lato-Regular': true}, atomicFonts),
    expectedPreloadLinks
  );
  t.end();
});

function equalWithoutSpaces(t, str1, str2) {
  t.equal(str1.replace(/\s/g, ''), str2.replace(/\s/g, ''));
}
