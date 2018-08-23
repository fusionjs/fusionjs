// @flow

/* global window */

import {createPlugin} from 'fusion-core';

export default createPlugin({
  middleware() {
    return (ctx, next) => {
      if ('serviceWorker' in window.navigator) {
        window.addEventListener('load', function register() {
          const sw = window.navigator.serviceWorker;
          sw
            .register('/sw.js')
            .then(res => console.log('*** sw registered:', res))
            .catch(e => console.log('*** sw registration failed:', e));
        });
      }
      return next();
    };
  },
});
