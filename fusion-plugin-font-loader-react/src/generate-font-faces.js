/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import toKebabCase from 'just-kebab-case';
import type {AtomicFontsObjectType, StyledFontsObjectType} from './types';

export function generateFontFaces(
  fonts: AtomicFontsObjectType | StyledFontsObjectType
) {
  // first sort atomic and styled font faces so font-faces will be well ordered
  const atomicDescriptors = [];
  const styledDescriptors = [];
  Object.keys(fonts).forEach(fontName => {
    const font = fonts[fontName];
    if (Array.isArray(font)) {
      styledDescriptors.push({fontName, font});
    } else if (font) {
      atomicDescriptors.push({fontName, font});
    }
  });

  const atomicFaces = atomicDescriptors.map(
    ({fontName, font}) =>
      `@font-face {
  font-family: "${fontName}";
  font-display: fallback;
  src: ${String(asFontFaceSrc(font.urls))};
}`
  );

  const styledFaces = [];
  styledDescriptors.forEach(({fontName, font}) =>
    styledFaces.push(
      ...font.map(
        fontInstance =>
          `@font-face {
font-family: "${fontName}";
font-display: fallback;
src: ${asFontFaceSrc(fontInstance.urls).join(',\n')};
${asFontFaceStyles(fontInstance.styles).join('')}}`
      )
    )
  );

  return '\n' + atomicFaces.concat(styledFaces).join('\n');
}

function asFontFaceSrc(urls) {
  // `urls` is a dictionary of font types (woff, woff2 etc) to url string
  return Object.keys(urls).map(
    type => `url("${String(urls[type])}") format("${type}")`
  );
}

function asFontFaceStyles(styles = {}) {
  return Object.keys(styles).map(
    key => `${toKebabCase(key)}: ${styles[key]};\n`
  );
}
