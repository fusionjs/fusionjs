import React from 'react';
import Provider from './provider';

export default {
  create: (name, plugin, provider) => {
    let originalMiddleware = plugin.middleware;
    const ProviderComponent = provider || Provider.create(name);
    plugin.middleware = (deps, provides) => {
      if (originalMiddleware) {
        originalMiddleware = originalMiddleware(deps, provides);
      }
      return function(ctx, next) {
        if (ctx.element) {
          ctx.element = React.createElement(
            ProviderComponent,
            {provides},
            ctx.element
          );
        }
        if (originalMiddleware) {
          return originalMiddleware(ctx, next);
        }
        return next();
      };
    };
    return plugin;
  },
};
