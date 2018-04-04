/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Provider from './provider';

export default {
  create: (name, plugin, provider) => {
    let originalMiddleware = plugin.middleware;
    const ProviderComponent = provider || Provider.create(name);
    plugin.middleware = (deps, provides) => {
      let nextMiddleware =
        originalMiddleware && originalMiddleware(deps, provides);
      return function(ctx, next) {
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
    };
    return plugin;
  },
};
