/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

/* eslint-env browser */

export default function createClientHydrate({element}) {
  return function clientHydrate(ctx, next) {
    ctx.prefix = getSerializedRoutePrefix();
    ctx.element = element;
    ctx.preloadChunks = [];
    return next();
  };
}

export function getSerializedRoutePrefix() {
  return window.__ROUTE_PREFIX__ || ''; // serialized by ./server
}
