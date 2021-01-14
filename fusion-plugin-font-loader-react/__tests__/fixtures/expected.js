/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const fallbackLookup = {
  depth0: {},
  depth1: {
    'Lato-Bold': {
      name: 'Lato-Regular',
      styles: {fontWeight: 'bold'},
    },
    'Lato-Thin': {
      name: 'Lato-Regular',
      styles: {fontWeight: '100'},
    },
  },
  depth2: {
    'Lato-Regular': {
      name: 'Helvetica',
    },
    'Lato-Bold': {
      name: 'Helvetica',
    },
    'Lato-Thin': {
      name: 'Helvetica',
    },
  },
};

export const atomicFontFaces = `
  @font-face{font-family:"Lato-Regular";font-display:fallback;src:url("Lato-Regular.woff")format("woff"),url("Lato-Regular.woff2")format("woff2");}
  @font-face{font-family:"Lato-Bold";font-display:fallback;src:url("Lato-Bold.woff")format("woff"),url("Lato-Bold.woff2")format("woff2");}
  @font-face{font-family:"Lato-Thin";font-display:fallback;src:url("Lato-Thin.woff")format("woff"),url("Lato-Thin.woff2")format("woff2");}`;

export const styledFontFaces = `
  @font-face {font-family: "Lato"; font-display: fallback; src: url("Lato-Regular.woff") format("woff"), url("Lato-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal;}
  @font-face {font-family: "Lato"; font-display: fallback; src: url("Lato-Bold.woff") format("woff"), url("Lato-Bold.woff2") format("woff2"); font-weight:600; font-style: normal;}
  @font-face {font-family: "Lato"; font-display: fallback; src: url("Lato-Thin.woff") format("woff"), url("Lato-Thin.woff2") format("woff2"); font-weight:200; font-style: normal;}`;

export const mixedFontFaces = `
  @font-face{font-family:"Lato-Regular";font-display:fallback;src:url("Lato-Regular.woff")format("woff"),url("Lato-Regular.woff2")format("woff2");}
  @font-face{font-family:"Lato-Bold";font-display:fallback;src:url("Lato-Bold.woff")format("woff"),url("Lato-Bold.woff2")format("woff2");}
  @font-face{font-family:"Lato-Thin";font-display:fallback;src:url("Lato-Thin.woff")format("woff"),url("Lato-Thin.woff2")format("woff2");}
  @font-face {font-family: "Lato"; font-display: fallback; src: url("Lato-Regular.woff") format("woff"), url("Lato-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal;}
  @font-face {font-family: "Lato"; font-display: fallback; src: url("Lato-Bold.woff") format("woff"), url("Lato-Bold.woff2") format("woff2"); font-weight:600; font-style: normal;}
  @font-face {font-family: "Lato"; font-display: fallback; src: url("Lato-Thin.woff") format("woff"), url("Lato-Thin.woff2") format("woff2"); font-weight:200; font-style: normal;}`;

export const preloadLinks =
  '\n<link rel="preload" href="Lato-Regular.woff2" as="font" type="font/woff2" crossorigin>';
