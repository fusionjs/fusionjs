/* eslint-env browser */
export default function createClientHydrate({element}) {
  return function clientHydrate(ctx, next) {
    ctx.prefix = window.__ROUTE_PREFIX__ || ''; // serialized by ./server
    ctx.element = element;
    ctx.preloadChunks = [];
    return next();
  };
}
