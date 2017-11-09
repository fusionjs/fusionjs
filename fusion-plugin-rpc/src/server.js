/* eslint-env node */

import {Plugin} from 'fusion-core';
import bodyparser from 'koa-bodyparser';
const statKey = 'rpc:method';

export default ({handlers = {}, EventEmitter}) => {
  const parseBody = bodyparser();
  const err = (ctx, e) => {
    ctx.status = 400;
    ctx.body = {error: e.message};
  };

  function hasHandler(method) {
    return handlers.hasOwnProperty(method);
  }

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
    async request(method, args) {
      const startTime = ms();
      const emitter = EventEmitter && EventEmitter.of(this.ctx);
      if (!hasHandler(method)) {
        const e = new MissingHandlerError(method);
        if (emitter) {
          emitter.emit('rpc:error', {
            method,
            origin: 'server',
            error: e,
          });
        }
        throw e;
      }
      try {
        const result = await handlers[method](args, this.ctx);
        if (emitter) {
          emitter.emit(statKey, {
            method,
            status: 'success',
            origin: 'server',
            timing: ms() - startTime,
          });
        }
        return result;
      } catch (e) {
        if (emitter) {
          emitter.emit(statKey, {
            method,
            error: e,
            status: 'failure',
            origin: 'server',
            timing: ms() - startTime,
          });
        }
        throw e;
      }
    }
  }

  return new Plugin({
    Service: RPC,
    async middleware(ctx, next) {
      const emitter = EventEmitter && EventEmitter.of(ctx);
      if (ctx.method === 'POST' && ctx.path.startsWith(`${ctx.prefix}/api/`)) {
        const startTime = ms();
        const [, method] = ctx.path.match(/\/api\/([^/]+)/i) || [];
        if (hasHandler(method)) {
          await parseBody(ctx, () => Promise.resolve());
          try {
            ctx.body = await handlers[method](ctx.request.body, ctx);
            if (emitter) {
              emitter.emit(statKey, {
                method,
                status: 'success',
                origin: 'browser',
                timing: ms() - startTime,
              });
            }
          } catch (e) {
            err(ctx, e);
            if (emitter) {
              emitter.emit(statKey, {
                method,
                error: e,
                status: 'failure',
                origin: 'browser',
                timing: ms() - startTime,
              });
            }
          }
        } else {
          const e = new MissingHandlerError(method);
          err(ctx, e);
          if (emitter) {
            emitter.emit('rpc:error', {
              origin: 'browser',
              method,
              error: e,
            });
          }
        }
      }
      return next();
    },
  });
};

class MissingHandlerError extends Error {
  constructor(method) {
    super(`Missing RPC handler for ${method}`);
    Error.captureStackTrace(this, MissingHandlerError);
  }
}

function ms() {
  const [seconds, ns] = process.hrtime();
  return Math.round(seconds * 1000 + ns / 1e6);
}
