/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import toKebabCase from 'just-kebab-case';
import type {AtomicFontsObjectType, StyledFontsObjectType} from './types';

export function generateAtomicFontFaces(fonts: AtomicFontsObjectType) {
  const faces = [];
  Object.keys(fonts).forEach(fontName => {
    const font = fonts[fontName];
    if (font) {
      faces.push(
        `@font-face {
          font-family: "${fontName}";
          font-display: fallback;
          src: ${String(asFontFaceSrc(font.urls))};
        }`
      );
    }
  });
  return '\n' + faces.join('\n');
}

export function generateStyledFontFaces(fonts: StyledFontsObjectType) {
  const faces = [];
  Object.keys(fonts).forEach(fontName => {
    fonts[fontName].forEach(fontInstance => {
      faces.push(
        `@font-face {
font-family: "${fontName}";
font-display: fallback;
src: ${asFontFaceSrc(fontInstance.urls).join(',\n')};
${String(asFontFaceStyles(fontInstance.styles))}}`
      );
    });
  });
  return '\n' + faces.join('\n');
}

function asFontFaceSrc(urls) {
  // `urls` is a dictionary of font types (woff, woff2 etc) to url string
  return Object.keys(urls).map(
    type => `url("${String(urls[type])}") format("${type}")`
  );
}

function asFontFaceStyles(styles) {
  return styles
    ? Object.keys(styles).map(key => `${toKebabCase(key)}: ${styles[key]};\n`)
    : '';
}
