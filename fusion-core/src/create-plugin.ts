/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {FusionPlugin, FusionPluginDepsType} from './types';
import {captureStackTrace} from './stack-trace';
import {createPlugin as compatCreatePlugin} from './legacy-compat';

// eslint-disable-next-line flowtype/generic-spacing
type FusionPluginNoHidden<TDeps extends FusionPluginDepsType, TService> = Omit<
  FusionPlugin<TDeps, TService>,
  '__plugin__' | 'stack' | '__fn__'
>;

export function createPlugin<
  TDeps extends FusionPluginDepsType,
  TService extends any
>(opts: FusionPluginNoHidden<TDeps, TService>): FusionPlugin<TDeps, TService> {
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
