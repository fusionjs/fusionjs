/* eslint-env browser */
import {compose} from './plugin/index.js';
import timing from './timing';

export default function() {
  return class ClientApp {
    constructor(element, render) {
      function ssr(ctx, next) {
        ctx.prefix = window.__ROUTE_PREFIX__ || ''; // serialized by ./server
        ctx.element = element;
        ctx.preloadChunks = [];
        return next();
      }
      function renderer(ctx, next) {
        const rendered = render(ctx.element);
        if (rendered instanceof Promise) {
          render(ctx.element)
            .then(rendered => {
              ctx.rendered = rendered;
              return next();
            })
            .catch(next);
        } else {
          ctx.rendered = rendered;
          return next();
        }
      }
      this.plugins = [timing, ssr, renderer];
    }
    onerror(e) {
      throw e;
    }
    plugin(plugin, dependencies) {
      const service = plugin(dependencies);
      this.plugins.splice(-1, 0, service);
      return service;
    }
    callback() {
      const middleware = compose(this.plugins);
      return () => {
        const ctx = {
          url: window.location.path + window.location.search,
          element: null,
          body: null,
        };
        return middleware(ctx).then(() => ctx);
      };
    }
    simulate(ctx) {
      return compose(this.plugins)(ctx).then(() => ctx);
    }
  };
}
