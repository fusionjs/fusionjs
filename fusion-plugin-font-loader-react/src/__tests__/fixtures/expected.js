export const fallbackLookup = {
  depth0: {},
  depth1: {
    'Lato-Bold': {
      name: 'Lato-Regular',
      styles: {'font-weight': 'bold'},
    },
    'Lato-Thin': {
      name: 'Lato-Regular',
      styles: {'font-weight': '100'},
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

export const fontFaces =
  '\n@font-face {font-family: "Lato-Regular"; src: url("/_static/Lato-Regular.woff") format("woff")\n,url("/_static/Lato-Regular.woff2") format("woff2")\n;}\n@font-face {font-family: "Lato-Bold"; src: url("/_static/Lato-Bold.woff") format("woff")\n,url("/_static/Lato-Bold.woff2") format("woff2")\n;}\n@font-face {font-family: "Lato-Thin"; src: url("/_static/Lato-Thin.woff") format("woff")\n,url("/_static/Lato-Thin.woff2") format("woff2")\n;}';

export const preloadLinks =
  '\n<link rel="font" href="/_static/Lato-Regular.woff2" as="font" type="font/woff2" crossorigin>';
