/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  AtomicFontsObjectType,
  StyledFontsObjectType,
} from '../../../src/types.js';

const atomicFonts: AtomicFontsObjectType = {
  'Lato-Regular': {
    urls: {
      woff: 'Lato-Regular.woff',
      woff2: 'Lato-Regular.woff2',
    },
    fallback: {
      name: 'Helvetica',
    },
  },
  'Lato-Bold': {
    urls: {
      woff: 'Lato-Bold.woff',
      woff2: 'Lato-Bold.woff2',
    },
    fallback: {
      name: 'Lato-Regular',
      styles: {
        fontWeight: 'bold',
      },
    },
  },
  'Lato-Thin': {
    urls: {
      woff: 'Lato-Thin.woff',
      woff2: 'Lato-Thin.woff2',
    },
    fallback: {
      name: 'Lato-Regular',
      styles: {
        fontWeight: '100',
      },
    },
  },
};

const styledFonts: StyledFontsObjectType = {
  Lato: [
    {
      urls: {
        woff: 'Lato-Regular.woff',
        woff2: 'Lato-Regular.woff2',
      },
      styles: {
        fontWeight: 400,
        fontStyle: 'normal',
      },
    },
    {
      urls: {
        woff: 'Lato-Bold.woff',
        woff2: 'Lato-Bold.woff2',
      },
      styles: {
        fontWeight: 600,
        fontStyle: 'normal',
      },
    },
    {
      urls: {
        woff: 'Lato-Thin.woff',
        woff2: 'Lato-Thin.woff2',
      },
      styles: {
        fontWeight: 200,
        fontStyle: 'normal',
      },
    },
  ],
};

const fontsByType = {
  styled: styledFonts,
  atomic: atomicFonts,
  both: Object.assign({}, atomicFonts, styledFonts),
};

export function getFontConfig(
  withStyleOverloads: boolean,
  preloadOverrides?: {}
) {
  return {
    withStyleOverloads,
    preloadDepth: 0,
    fonts: withStyleOverloads ? styledFonts : atomicFonts,
    preloadOverrides,
  };
}

export function getUniversalFontConfig(
  type?: string = 'both',
  preloadOverrides?: {}
) {
  return {
    preloadDepth: 0,
    fonts: fontsByType[type],
    preloadOverrides,
  };
}
