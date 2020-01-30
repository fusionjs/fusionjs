// @flow
import type {Context} from 'fusion-core';
import {createPlugin} from 'fusion-core';

export default createPlugin<mixed, void>({
  middleware() {
    return (ctx: Context, next: () => Promise<*>) => {
      if (ctx.method === 'GET' && ctx.path === '/redirect') {
        ctx.redirect('/redirected');
      }
      return next();
    };
  },
});
