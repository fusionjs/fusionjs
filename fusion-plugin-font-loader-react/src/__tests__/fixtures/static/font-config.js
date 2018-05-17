/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FontType} from '../../../types.js';

export const preloadDepth: number = 1;
export const fonts: {[string]: FontType} = {
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
