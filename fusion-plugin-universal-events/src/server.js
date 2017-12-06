// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* eslint-env node */
import {Plugin} from 'fusion-core';
import Emitter from './emitter';

export default function() {
  const bodyParser = require('koa-bodyparser');
  const parseBody = bodyParser();

  const plugin = new Plugin({
    Service: class UniversalEmitter extends Emitter {
      constructor(ctx) {
        super();
        this.ctx = ctx;
        if (this.ctx) {
          this.parent = plugin.of();
          this.batch = [];
        }
      }
      emit(type, payload, ctx) {
        payload = super.mapEvent(type, payload, this.ctx);
        if (!this.ctx) {
          super.handleEvent(type, payload, ctx);
        } else {
          payload = this.parent.mapEvent(type, payload, this.ctx);
          this.batch.push({type, payload});
        }
      }
      flush() {
        if (!this.ctx) {
          throw new Error(
            'Cannot call flush from the global instance of UniversalEmitter. Try using `UniversalEmitter.of(ctx)`'
          );
        }
        for (let index = 0; index < this.batch.length; index++) {
          const {type, payload} = this.batch[index];
          super.handleEvent(type, payload, this.ctx);
          this.parent.handleEvent(type, payload, this.ctx);
        }
        this.batch = [];
      }
      // mirror browser api
      setFrequency() {}
      teardown() {}
    },
    async middleware(ctx, next) {
      const emitter = this.of(ctx);
      if (!ctx.body && ctx.method === 'POST' && ctx.path === '/_events') {
        await parseBody(ctx, async () => {});
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
      await next();
      emitter.flush();
    },
  });
  return plugin;
}
