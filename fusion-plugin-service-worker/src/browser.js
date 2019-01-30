// @flow

/* global window */

import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {SWLoggerToken} from './tokens';

export default ((createPlugin({
  deps: {
    logger: SWLoggerToken.optional,
  },
  middleware({logger = console}) {
    return (ctx, next) => {
      if ('serviceWorker' in window.navigator) {
        window.addEventListener('load', function register() {
          const sw = window.navigator.serviceWorker;
          sw.register('/sw.js')
            .then(res => logger.log('*** sw registered:', res))
            .catch(e => logger.log('*** sw registration failed:', e));
        });
      }
      return next();
    };
  },
}): any): FusionPlugin<{}, void>);
