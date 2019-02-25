// @flow
import {createPlugin} from 'fusion-core';
import type {Context} from 'fusion-core';

export default createPlugin<mixed, void>({
  middleware() {
    return (ctx: Context, next: () => Promise<*>) => {
      if (ctx.method === 'GET' && ctx.path === '/error-500') {
        ctx.response.status = 500;
        ctx.body = "<html><head></head><body><div>the wrong html</div></body></html>";
        ctx.set('Content-Type', 'text/html ');
      } else if (ctx.method === 'GET' && ctx.path === '/error-200') {
        ctx.response.status = 200;
        ctx.body = {things: 'look bad'};
        ctx.set('Content-Type', 'application/json');
      }
      return next();
    }
  },
});
