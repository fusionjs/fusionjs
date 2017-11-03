import React from 'react';
import Provider from './provider';

export default {
  create: (name, plugin, BaseComponent) => (...args) => {
    const p = plugin(...args);
    const middleware = p.middleware;
    const ProviderComponent = Provider.create(name, BaseComponent);
    p.middleware = function(ctx, next) {
      if (ctx.element) {
        ctx.element = React.createElement(
          ProviderComponent,
          {service: this.of(ctx)},
          ctx.element
        );
      }
      return middleware.call(p, ctx, next);
    };
    return p;
  },
};
