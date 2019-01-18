// @flow

/* global window */

import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';

import {SWTemplateFunctionToken} from './tokens';

export default ((createPlugin({
  deps: {
    templateFn: SWTemplateFunctionToken,
  },
  middleware() {
    return (ctx, next) => {
      if ('serviceWorker' in window.navigator) {
        window.addEventListener('load', function register() {
          const sw = window.navigator.serviceWorker;
          sw.register('/sw.js')
            /* eslint-disable-next-line no-console */
            .then(res => console.log('*** sw registered:', res))
            /* eslint-disable-next-line no-console */
            .catch(e => console.log('*** sw registration failed:', e));
        });
      }
      return next();
    };
  },
}): any): FusionPlugin<{}, void>);
