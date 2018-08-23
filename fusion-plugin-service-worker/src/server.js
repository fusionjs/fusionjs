// @flow

/* global */

import {createPlugin /*, serviceWorkerTemplate */} from 'fusion-core';

// TODO(#23): temporary imports
import serviceWorkerTemplateSouce from './mock-service-worker-source';

// TODO(#23): this will be in fusion-core
function serviceWorkerTemplate(args) {
  return `${serviceWorkerTemplateSouce};serviceWorker(${JSON.stringify(args)})`;
}

export default createPlugin({
  middleware() {
    return async (ctx, next) => {
      if (__NODE__) {
        if (ctx.method === 'GET' && ctx.url === '/sw.js') {
          // TODO(#24): get value properly
          const chunkUrls = Array.from(ctx.chunkUrlMap).map(
            value => `${ctx.assetPath}/${value[1].get('es5')}`
          );
          try {
            ctx.type = 'text/javascript';
            ctx.set('Cache-Control', 'max-age=0');
            ctx.body = serviceWorkerTemplate({
              // TODO(#24): use correct values
              precachePaths: chunkUrls,
              cacheablePaths: chunkUrls,
            });
          } catch (e) {
            // TODO(#25): do something maybe
          }
        }
        return next();
      }
    };
  },
});
