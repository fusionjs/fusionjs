/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {captureStackTrace} from './stack-trace.js';

import {createPlugin as compatCreatePlugin} from './legacy-compat.js';

export function createPlugin(opts) {
  // Inject the legacy plugin properties for compatibiity purposes.
  // However, we should eventually get rid of these properties and possibly
  // instead just represent plugins as plain generator functions.
  return {
    ...opts,
    __plugin__: true,
    __fn__: compatCreatePlugin(opts),
    stack: captureStackTrace(createPlugin),
  };
}

export function declarePlugin(fn) {
  fn.__fplugin__ = true;
  return fn;
}

export function getPluginFn(val) {
  if (val && val.__plugin__ && val.__fn__) {
    return val.__fn__;
  }
  if (val && val.__fplugin__) {
    return val;
  }
}
