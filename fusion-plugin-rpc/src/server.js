/* eslint-env node */

import {html} from 'fusion-core';
import {Plugin} from 'fusion-core';
import bodyparser from 'koa-bodyparser';
const statKey = 'rpc:method';

export default ({handlers = {}, EventEmitter}) => {
  const parseBody = bodyparser();
  const err = (ctx, e) => {
    ctx.status = 400;
    ctx.body = {error: e.message};
  };
  const methods = JSON.stringify(Object.keys(handlers));
  const script = html`<script type="application/json" id="__DATA_FETCHING_METHODS__">${methods}</script>`; // consumed by ./browser
  class RPC {
    constructor(ctx) {
      // TODO(#5): update check to look for truthy ctx
      if (!ctx.headers) {
        throw new Error(
          'fusion-plugin-rpc requires `ctx`. Try using `RPC.of(ctx)`'
        );
      }
      this.ctx = ctx;
    }
  }
  for (const key in handlers) {
    if (typeof handlers[key] === 'function') {
      RPC.prototype[key] = async function(args) {
        // TODO(#4): add timing events here
        return handlers[key](args, this.ctx);
      };
    }
  }

  return new Plugin({
    Service: RPC,
    async middleware(ctx, next) {
      const emitter = EventEmitter && EventEmitter.of(ctx);
      const rpc = this.of(ctx);
      if (ctx.element) {
        ctx.body.body.push(script);
      } else if (ctx.path.startsWith(`${ctx.prefix}/api/`)) {
        const startTime = ms();
        const [, method] = ctx.path.match(/\/api\/([^/]+)/i) || [];
        if (typeof rpc[method] === 'function') {
          await parseBody(ctx, () => Promise.resolve());
          try {
            ctx.body = await rpc[method](ctx.request.body);
            if (emitter) {
              emitter.emit(statKey, {
                method,
                status: 'success',
                code: ctx.status,
                timing: ms() - startTime,
              });
            }
          } catch (e) {
            err(ctx, e);
            if (emitter) {
              emitter.emit(statKey, {
                method,
                status: 'failure',
                code: ctx.status,
                timing: ms() - startTime,
              });
            }
          }
        } else {
          err(ctx, new Error('Invalid endpoint: ' + ctx.path));
          if (emitter) emitter.emit('rpc:error', {method});
        }
      }
      return next();
    },
  });
};

function ms() {
  const [seconds, ns] = process.hrtime();
  return Math.round(seconds * 1000 + ns / 1e6);
}
