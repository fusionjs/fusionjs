// @noflow
// Example of using a flow-typed plugin so we can ensure that babel parsing works
import type {Context} from 'fusion-core';

export default (ctx: Context, next: () => Promise<*>) => {
  if (!ctx.element && ctx.path === '/health') {
    ctx.status = 200;
    ctx.body = 'OK';
  }
  return next();
};
