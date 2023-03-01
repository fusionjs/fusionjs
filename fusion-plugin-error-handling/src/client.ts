/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */

import {createPlugin, createToken} from 'fusion-core';
import type {Token} from 'fusion-core';

import type {ErrorHandlerPluginType} from './types';

export const ErrorHandlingEmitterToken: Token<any> = createToken(
  'ErrorHandlingEmitterToken'
);

const plugin =
  __BROWSER__ &&
  createPlugin({
    deps: {emit: ErrorHandlingEmitterToken.optional},
    provides: ({emit}) => {
      let _emit =
        emit ||
        ((e, src) => {
          if (window.onerror) window.onerror(e?.message, src, null, null, e);
        });
      if (__DEV__) {
        let oldEmit = _emit;
        _emit = (e, src) => {
          oldEmit(e, src);
          throw e;
        };
      }
      const addListener = (key) => {
        if (
          key.match(/webkit/) == null && // stop deprecation warnings
          window[key] &&
          // @ts-expect-error
          window[key].prototype &&
          // @ts-expect-error
          window[key].prototype.addEventListener
        ) {
          // @ts-expect-error
          const proto = window[key].prototype;
          const old = proto.addEventListener;
          proto.addEventListener = function (type, fn, ...rest) {
            const cb = function (...args) {
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
      };
      for (const key in window) {
        try {
          addListener(key);
        } catch (e) {
          // Ignore. Don't have access to the prop, possibly cross-origin restriction.
        }
      }
      window.addEventListener('unhandledrejection', (event) => {
        event.preventDefault();
        _emit(event.reason, 'unhandled-rejection');
      });
    },
  });

export default plugin as any as ErrorHandlerPluginType;
