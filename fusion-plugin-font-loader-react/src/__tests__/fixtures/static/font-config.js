export const preloadDepth = 1;
export const fonts = {
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
        'font-weight': 'bold',
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
        'font-weight': '100',
      },
    },
  },
};
