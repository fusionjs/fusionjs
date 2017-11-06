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
import {SingletonPlugin} from 'fusion-core';
import Emitter from './emitter';

export default function() {
  const bodyParser = require('koa-bodyparser');
  const parseBody = bodyParser();

  return new SingletonPlugin({
    Service: class UniversalEmitter extends Emitter {
      // mirror browser api
      setFrequency() {}
      flush() {}
      teardown() {}
    },
    async middleware(ctx, next) {
      if (!ctx.body && ctx.method === 'POST' && ctx.path === '/_events') {
        await parseBody(ctx, async () => {});
        const {items} = ctx.request.body;
        if (items) {
          items.forEach(({type, payload}) => {
            this.of().emit(type, payload, ctx);
          });
          await next();
          ctx.status = 200;
        } else {
          await next();
          ctx.status = 400;
        }
      } else {
        return next();
      }
    },
  });
}
