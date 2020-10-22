/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FusionPlugin} from './types.js';
import {captureStackTrace} from './stack-trace.js';

// eslint-disable-next-line flowtype/generic-spacing
type FusionPluginNoHidden<TDeps, TService> = $Diff<
  FusionPlugin<TDeps, TService>,
  {__plugin__: boolean, stack: string}
>;

export function createPlugin<TDeps, TService>(
  opts: $Exact<FusionPluginNoHidden<TDeps, TService>>
): FusionPlugin<TDeps, TService> {
  return {
    __plugin__: true,
    stack: captureStackTrace(createPlugin),
    ...opts,
  };
}
