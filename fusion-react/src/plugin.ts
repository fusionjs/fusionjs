/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';

import {createPlugin} from 'fusion-core';
import type {FusionPlugin, Middleware, FusionPluginDepsType} from 'fusion-core';

import Provider from './provider';

// eslint-disable-next-line
type FusionPluginNoHidden<TDeps extends FusionPluginDepsType, TService> = Omit<
  FusionPlugin<TDeps, TService>,
  '__plugin__' | 'stack'
>;

export default {
  create: <TDeps extends FusionPluginDepsType, TService extends any>(
    name: string,
    // eslint-disable-next-line
    plugin:
      | (FusionPluginNoHidden<TDeps, TService> & {__plugin__?: void})
      | FusionPlugin<TDeps, TService>,
    provider?: React.ComponentType<any>
  ): FusionPlugin<TDeps, TService> => {
    let originalMiddleware = plugin.middleware;
    const ProviderComponent = provider || Provider.create(name);
    plugin.middleware = (deps: any, provides: any) => {
      let nextMiddleware =
        originalMiddleware && originalMiddleware(deps, provides);
      const mw: Middleware = function (ctx, next) {
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
    return createPlugin(plugin as any);
  },
};
