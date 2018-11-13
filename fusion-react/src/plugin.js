/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import {createPlugin} from 'fusion-core';
import type {FusionPlugin, Middleware} from 'fusion-core';

import Provider from './provider';

// eslint-disable-next-line
type FusionPluginNoHidden<TDeps, TService> = $Diff<
  FusionPlugin<TDeps, TService>,
  {__plugin__: boolean, stack: string}
>;

export default {
  create: <TDeps: *, TService: *>(
    name: string,
    // eslint-disable-next-line
    plugin:
      | FusionPluginNoHidden<TDeps, TService>
      | FusionPlugin<TDeps, TService>,
    provider?: React.ComponentType<*>
  ): FusionPlugin<TDeps, TService> => {
    if (plugin.__plugin__ === undefined) {
      plugin = createPlugin(plugin);
    }
    if (!plugin.__plugin__) {
      throw new Error(
        'Provided plugin does not match FusionPlugin<TDeps, TService>'
      );
    }

    let originalMiddleware = plugin.middleware;
    const ProviderComponent = provider || Provider.create(name);
    plugin.middleware = (deps: *, provides: *) => {
      let nextMiddleware =
        originalMiddleware && originalMiddleware(deps, provides);
      const mw: Middleware = function(ctx, next) {
        if (ctx.element) {
          ctx.element = React.createElement(
            ProviderComponent,
            {provides, ctx},
            ctx.element
          );
        }
        if (nextMiddleware) {
          return nextMiddleware(ctx, next);
        }
        return next();
      };
      return mw;
    };
    return plugin;
  },
};
