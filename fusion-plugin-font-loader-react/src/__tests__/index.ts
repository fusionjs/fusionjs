/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  getFontConfig,
  getUniversalFontConfig,
} from './fixtures/static/font-config';
import {
  fallbackLookup as expectedFallbackLookup,
  atomicFontFaces as expectedAtomicFontFaces,
  styledFontFaces as expectedStyledFontFaces,
  mixedFontFaces as expectedMixedFontFaces,
  preloadLinks as expectedPreloadLinks,
} from './fixtures/expected';

import generateFallbackMap from '../generate-fallback-map';
import {generateFontFaces} from '../generate-font-faces';
import type {AtomicFontsObjectType, StyledFontsObjectType} from '../types';
import generatePreloadLinks from '../generate-preload-links';

test('generateFallbackMap with atomic config', () => {
  const atomicFonts: AtomicFontsObjectType = getFontConfig(false).fonts as any;
  expect(generateFallbackMap(atomicFonts, 0)).toEqual(
    expectedFallbackLookup.depth0
  );
  expect(generateFallbackMap(atomicFonts, 1)).toEqual(
    expectedFallbackLookup.depth1
  );
  expect(generateFallbackMap(atomicFonts, 2)).toEqual(
    expectedFallbackLookup.depth2
  );
});

test('generateAtomicFontFaces using withStyleOverloads flag', () => {
  const atomicFonts: AtomicFontsObjectType = getFontConfig(false).fonts as any;
  equalWithoutSpaces(generateFontFaces(atomicFonts), expectedAtomicFontFaces);
});

test('generateStyledFontFaces using withStyleOverloads flag', () => {
  const styledFonts: StyledFontsObjectType = getFontConfig(true).fonts as any;
  equalWithoutSpaces(generateFontFaces(styledFonts), expectedStyledFontFaces);
});

test('generateAtomicFontFaces using inferrence', () => {
  const atomicFonts: AtomicFontsObjectType = getUniversalFontConfig('atomic')
    .fonts as any;
  equalWithoutSpaces(generateFontFaces(atomicFonts), expectedAtomicFontFaces);
});

test('generateStyledFontFaces using inferrence', () => {
  const styledFonts: StyledFontsObjectType = getUniversalFontConfig('styled')
    .fonts as any;
  equalWithoutSpaces(generateFontFaces(styledFonts), expectedStyledFontFaces);
});

test('generateMixedFontFaces using inferrence', () => {
  const styledFonts: StyledFontsObjectType = getUniversalFontConfig()
    .fonts as any;
  equalWithoutSpaces(generateFontFaces(styledFonts), expectedMixedFontFaces);
});

test('generatePreloadLinks', () => {
  const atomicFonts: AtomicFontsObjectType = getFontConfig(false).fonts as any;
  expect(generatePreloadLinks({'Lato-Regular': true}, atomicFonts)).toBe(
    expectedPreloadLinks
  );
});

function equalWithoutSpaces(str1, str2) {
  expect(str1.replace(/\s/g, '')).toBe(str2.replace(/\s/g, ''));
}
