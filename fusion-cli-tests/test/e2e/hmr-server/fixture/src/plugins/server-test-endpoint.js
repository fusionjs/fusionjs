// @noflow
import { createPlugin } from 'fusion-core';

const ServerTestEndpointPlugin = __NODE__ && createPlugin({
  middleware() {
    return function serverTestEndpointMiddleware(ctx, next) {
      if (ctx.path === '/server-test-endpoint') {
        ctx.body = 'server-test-endpoint-default';

        return;
      }

      return next();
    }
  }
});

export default ServerTestEndpointPlugin;
