// @flow

/* global window */

import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {SWLoggerToken, SWRegisterToken} from './tokens';
import {unregisterServiceWorker} from './utils';

export default ((createPlugin({
  deps: {
    logger: SWLoggerToken.optional,
    shouldRegister: SWRegisterToken.optional,
  },
  middleware({logger = console, shouldRegister = true}) {
    return (ctx, next) => {
      if ('serviceWorker' in window.navigator) {
        window.addEventListener('load', function register() {
          const sw = window.navigator.serviceWorker;
          if (shouldRegister) {
            sw.register('/sw.js')
              .then(res => logger.log('*** sw registered:', res))
              .catch(e => logger.log('*** sw registration failed:', e));
          } else {
            unregisterServiceWorker(logger);
          }
        });
      }
      return next();
    };
  },
}): any): FusionPlugin<{}, void>);
