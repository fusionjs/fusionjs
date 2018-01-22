/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
/* eslint-env node */

import {createPlugin, memoize} from 'fusion-core';
import type {Context, FusionPlugin} from 'fusion-core';
//$FlowFixMe
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import bodyparser from 'koa-bodyparser';
import MissingHandlerError from './missing-handler-error';
import {RPCHandlersToken} from './tokens';

const statKey = 'rpc:method';

/* Helper function */
function hasHandler(handlers, method) {
  return handlers.hasOwnProperty(method);
}

class RPC {
  ctx: Context;
  emitter: *;
  handlers: *;

  constructor(emitter: any, handlers: any, ctx: Context) {
    if (!ctx || !ctx.headers) {
      throw new Error('fusion-plugin-rpc requires `ctx`');
    }
    this.ctx = ctx;
    this.emitter = emitter;
    this.handlers = handlers;
  }

  async request(method: string, args: mixed) {
    const startTime = ms();
    const scopedEmitter = this.emitter.from(this.ctx);
    if (!hasHandler(this.handlers, method)) {
      const e = new MissingHandlerError(method);
      if (scopedEmitter) {
        scopedEmitter.emit('rpc:error', {
          method,
          origin: 'server',
          error: e,
        });
      }
      throw e;
    }
    try {
      const result = await this.handlers[method](args, this.ctx);
      if (scopedEmitter) {
        scopedEmitter.emit(statKey, {
          method,
          status: 'success',
          origin: 'server',
          timing: ms() - startTime,
        });
      }
      return result;
    } catch (e) {
      if (scopedEmitter) {
        scopedEmitter.emit(statKey, {
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

type RPCServiceFactory = {from: (ctx: Context) => RPC};
type RPCPluginType = FusionPlugin<*, RPCServiceFactory>;
const plugin: RPCPluginType = createPlugin({
  deps: {
    emitter: UniversalEventsToken,
    handlers: RPCHandlersToken,
  },

  provides: deps => {
    const {emitter, handlers} = deps;

    return {
      from: memoize(ctx => new RPC(emitter, handlers, ctx)),
    };
  },

  middleware: deps => {
    const {emitter, handlers} = deps;
    const parseBody = bodyparser();

    return async (ctx, next) => {
      const scopedEmitter = emitter.from(ctx);
      if (ctx.method === 'POST' && ctx.path.startsWith(`${ctx.prefix}/api/`)) {
        const startTime = ms();
        const [, method] = ctx.path.match(/\/api\/([^/]+)/i) || [];
        if (hasHandler(handlers, method)) {
          await parseBody(ctx, () => Promise.resolve());
          try {
            const result = await handlers[method](ctx.request.body, ctx);
            ctx.body = {
              status: 'success',
              data: result,
            };
            if (scopedEmitter) {
              scopedEmitter.emit(statKey, {
                method,
                status: 'success',
                origin: 'browser',
                timing: ms() - startTime,
              });
            }
          } catch (e) {
            ctx.body = {
              status: 'failure',
              data: {
                message: e.message,
                code: e.code,
                meta: e.meta,
              },
            };
            if (scopedEmitter) {
              scopedEmitter.emit(statKey, {
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
          ctx.body = {
            status: 'failure',
            data: {
              message: e.message,
              code: e.code,
            },
          };
          ctx.status = 404;
          if (scopedEmitter) {
            scopedEmitter.emit('rpc:error', {
              origin: 'browser',
              method,
              error: e,
            });
          }
        }
      }
      return next();
    };
  },
});

/* Helper functions */
function ms() {
  const [seconds, ns] = process.hrtime();
  return Math.round(seconds * 1000 + ns / 1e6);
}

export default plugin;
