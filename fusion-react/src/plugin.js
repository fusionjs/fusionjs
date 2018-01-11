import React from 'react';
import Provider from './provider';

export default {
  create: (name, plugin, BaseComponent) => (...args) => {
    const p = plugin(...args);
    const middleware = p.__middleware__;
    const ProviderComponent = Provider.create(name, BaseComponent);
    p.__middleware__ = function(ctx, next) {
      if (ctx.element) {
        ctx.element = React.createElement(
          ProviderComponent,
          {service: this.of(ctx)},
          ctx.element
        );
      }
      return middleware ? middleware.call(p, ctx, next) : next();
    };
    return p;
  },
};
