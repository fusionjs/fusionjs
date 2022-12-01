/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env node */
import { memoize, createPlugin, RouteTagsToken } from "fusion-core";
import type { FusionPlugin, Context } from "fusion-core";

import Emitter from "./emitter";
import type {
  IEmitter,
  UniversalEventsPluginDepsType as DepsType,
} from "./types";

export class GlobalEmitter extends Emitter {
  from: (ctx: Context) => ScopedEmitter;
  ctx: Context;

  constructor() {
    super();
    this.from = memoize((ctx) => {
      return new ScopedEmitter(ctx, this);
    });
  }
  emit(type: string, payload: unknown, ctx?: Context): void {
    payload = super.mapEvent(type, payload, this.ctx);
    super.handleEvent(type, payload, ctx);
  }
  // mirror browser api
  setFrequency() {}
  teardown() {}
}

class ScopedEmitter extends Emitter {
  ctx: Context;
  parent: GlobalEmitter;
  batch: Array<{
    type: string;
    payload: any;
  }>;
  flushed: boolean;

  constructor(ctx: Context, parent: GlobalEmitter) {
    super();
    this.ctx = ctx;
    this.parent = parent;
    this.batch = [];
    this.flushed = false;
  }
  emit(type: string, payload: unknown) {
    // this logic exists to manage ensuring we send events after the batch
    if (this.flushed) {
      this.handleBatchedEvent({ type, payload });
    } else {
      this.batch.push({ type, payload });
    }
  }
  handleBatchedEvent({ type, payload }: { type: string; payload: unknown }) {
    payload = super.mapEvent(type, payload, this.ctx);
    payload = this.parent.mapEvent(type, payload, this.ctx);
    super.handleEvent(type, payload, this.ctx);
    this.parent.handleEvent(type, payload, this.ctx);
  }
  flush() {
    for (let index = 0; index < this.batch.length; index++) {
      this.handleBatchedEvent(this.batch[index]);
    }
    this.batch = [];
    this.flushed = true;
  }
  // mirror browser api
  setFrequency() {}
  teardown() {}
}

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {
      RouteTags: RouteTagsToken,
    },
    provides: () => new GlobalEmitter(),
    middleware: (deps, globalEmitter) => {
      const bodyParser = require("koa-bodyparser");
      // Forcing to parse JSON even if the Content-Type is different because we only expect JSON
      // payloads for events and the browser sends beacons with Content-Type: 'text/plain' due to
      // this bug http://crbug.com/490015
      const parseBody = bodyParser({ detectJSON: () => true });
      return async function universalEventsMiddleware(ctx, next) {
        const emitter = globalEmitter.from(ctx);
        if (ctx.method === "POST" && ctx.path === "/_events") {
          deps.RouteTags.from(ctx).name = "universal_events";
          await parseBody(ctx, async () => {});
          // $FlowFixMe
          const { items } = ctx.request.body;
          if (items) {
            for (let index = 0; index < items.length; index++) {
              const { type, payload } = items[index];
              emitter.emit(type, payload);
            }
            ctx.status = 200;
          } else {
            ctx.status = 400;
          }
        }
        // awaiting next before registering `then` on ctx.timing.end to try and get as much as possible
        // into the event batch flush.
        try {
          await next();
        } finally {
          // handle flushing in the case of an error
          ctx.timing.end.then(() => {
            emitter.flush();
          });
        }
      };
    },
  });

export default plugin as any as FusionPlugin<DepsType, IEmitter>;
