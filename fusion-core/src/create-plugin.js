/* @flow */

import type {FusionPlugin} from './types.js';

// eslint-disable-next-line flowtype/generic-spacing
type FusionPluginNoHidden<TDeps, TService> = $Diff<
  FusionPlugin<TDeps, TService>,
  {__plugin__: boolean}
>;

export function createPlugin<TDeps, TService>(
  opts: $Exact<FusionPluginNoHidden<TDeps, TService>>
): FusionPlugin<TDeps, TService> {
  // $FlowFixMe
  opts.__plugin__ = true;
  // $FlowFixMe
  return opts;
}
