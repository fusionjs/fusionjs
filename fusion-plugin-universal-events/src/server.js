/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import {memoize, createPlugin} from 'fusion-core';
import type {FusionPlugin, Context} from 'fusion-core';

import Emitter from './emitter.js';
import type {
  IEmitter,
  UniversalEventsPluginDepsType as DepsType,
} from './types.js';

export class GlobalEmitter extends Emitter {
  from: any;
  ctx: any;

  constructor() {
    super();
    this.from = memoize(ctx => {
      return new ScopedEmitter(ctx, this);
    });
  }
  emit(type: mixed, payload: mixed, ctx?: Context): void {
    payload = super.mapEvent(type, payload, this.ctx);
    super.handleEvent(type, payload, ctx);
  }
  // mirror browser api
  setFrequency() {}
  teardown() {}
}

class ScopedEmitter extends Emitter {
  ctx: any;
  parent: any;
  batch: any;
  flushed: any;

  constructor(ctx, parent) {
    super();
    this.ctx = ctx;
    this.parent = parent;
    this.batch = [];
    this.flushed = false;
  }
  emit(type, payload) {
    // this logic exists to manage ensuring we send events after the batch
    if (this.flushed) {
      this.handleBatchedEvent({type, payload});
    } else {
      this.batch.push({type, payload});
    }
  }
  handleBatchedEvent({type, payload}) {
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
    provides: () => new GlobalEmitter(),
    middleware: (deps, globalEmitter) => {
      const bodyParser = require('koa-bodyparser');
      const parseBody = bodyParser();
      return async function universalEventsMiddleware(ctx, next) {
        const emitter = globalEmitter.from(ctx);
        if (ctx.method === 'POST' && ctx.path === '/_events') {
          await parseBody(ctx, async () => {});
          // $FlowFixMe
          const {items} = ctx.request.body;
          if (items) {
            for (let index = 0; index < items.length; index++) {
              const {type, payload} = items[index];
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

export default ((plugin: any): FusionPlugin<DepsType, IEmitter>);
