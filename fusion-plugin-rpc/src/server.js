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

  return new Plugin({
    Service: class RPC {
      constructor() {
        for (const key in handlers) {
          if (typeof handlers[key] === 'function') {
            this[key] = async args => {
              // TODO(#4): add timing events here
              return handlers[key](args);
            };
          }
        }
      }
    },
    async middleware(ctx, next) {
      const emitter = EventEmitter && EventEmitter.of(ctx);
      if (ctx.element) {
        const methods = JSON.stringify(Object.keys(handlers));
        const script = html`<script type="application/json" id="__DATA_FETCHING_METHODS__">${methods}</script>`; // consumed by ./browser
        ctx.body.body.push(script);
      } else if (ctx.path.startsWith(`${ctx.prefix}/api/`)) {
        const startTime = ms();
        const [, method] = ctx.path.match(/\/api\/([^/]+)/i) || [];
        if (typeof handlers[method] === 'function') {
          await parseBody(ctx, () => Promise.resolve());
          try {
            ctx.body = await handlers[method](ctx.request.body);
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
