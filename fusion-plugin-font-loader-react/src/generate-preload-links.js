/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AtomicFontsObjectType} from './types';

export default function generatePreloadLinks(
  fontNames: {},
  fontDictionary: AtomicFontsObjectType
) {
  const links = [];
  Object.keys(fontNames).forEach(fontName => {
    const font = fontDictionary[fontName];
    if (font) {
      // We can't detect woff2 support on the server, but rel=prelaod
      // is only supported by browsers that support woff2.
      // Others will fail silently and pick up the font a little later
      // via the style
      links.push(
        `\n<link rel="preload" href="${
          font.urls.woff2
        }" as="font" type="font/woff2" crossorigin>`
      );
    }
  });
  return links.join('\n');
}
