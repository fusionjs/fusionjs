/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

import {createPlugin} from 'fusion-core';
import {createOptionalToken} from 'fusion-tokens';

export const ErrorHandlingEmitterToken = createOptionalToken(
  'ErrorHandlingEmitterToken',
  null
);

export default __BROWSER__ &&
  createPlugin({
    deps: {emit: ErrorHandlingEmitterToken},
    provides: ({emit}) => {
      let _emit =
        emit ||
        ((e, src) => {
          if (window.onerror) window.onerror(e.message, src, null, null, e);
        });
      if (__DEV__) {
        let oldEmit = _emit;
        _emit = (e, src) => {
          oldEmit(e, src);
          throw e;
        };
      }
      for (const key in window) {
        if (
          key.match(/webkit/) == null && // stop deprecation warnings
          window[key] &&
          window[key].prototype &&
          window[key].prototype.addEventListener
        ) {
          const proto = window[key].prototype;
          const old = proto.addEventListener;
          proto.addEventListener = function(type, fn, ...rest) {
            const cb = function(...args) {
              try {
                return fn.apply(this, args);
              } catch (e) {
                // get exception stack frames from our own code rather than potentially from 3rd party CDN code to get around CORS issues
                _emit(e, 'async-event');
              }
            };
            return old.call(this, type, cb, ...rest);
          };
        }
      }
      window.addEventListener('unhandledrejection', e => {
        e.preventDefault();
        _emit(e.reason instanceof Error ? e.reason : new Error(e.reason));
      });
    },
  });
