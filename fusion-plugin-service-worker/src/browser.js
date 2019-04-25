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
      const sw = window.navigator.serviceWorker;
      if (sw) {
        window.addEventListener('load', function register() {
          const existingSW = sw.controller;
          if (shouldRegister) {
            sw.register('/sw.js')
              .then(res => logger.log('*** sw registered:', res))
              .catch(e => logger.log('*** sw registration failed:', e));
            sw.addEventListener('message', event => {
              // additional listeners can be added at the app level
              if (existingSW && event.data.type === 'upgrade-available') {
                // prompt user to reload for new build
                logger.log(event.data.text);
              }
            });
          } else {
            unregisterServiceWorker(logger);
          }
        });
      }
      return next();
    };
  },
}): any): FusionPlugin<{}, void>);
