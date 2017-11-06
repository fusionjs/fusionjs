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

import React from 'react';
import {Router as ServerRouter} from './server';
import {Router as BrowserRouter} from './browser';

const Router = __NODE__ ? ServerRouter : BrowserRouter;
export default function getRouter({EventEmitter}) {
  const emitter = EventEmitter ? EventEmitter.of() : null;

  return function middleware(ctx, next) {
    if (__NODE__) {
      const pageData = {
        title: ctx.path,
        page: ctx.path,
      };
      if (ctx.element) {
        const context = {
          setCode: code => {
            ctx.status = code;
          },
        };
        ctx.element = (
          <Router
            pageData={pageData}
            basename={ctx.routePrefix}
            location={ctx.url}
            context={context}
          >
            {ctx.element}
          </Router>
        );
      }
      return next().then(() => {
        // default status code to 200 if no status component is rendered
        if (!ctx.status) {
          ctx.status = 200;
        }
        if (emitter) {
          const emitTiming = type => timing => {
            emitter.emit(type, {
              title: pageData.title,
              page: pageData.page,
              status: ctx.status,
              timing,
            });
          };
          ctx.timing.downstream.then(emitTiming('downstream:server'));
          ctx.timing.render.then(emitTiming('render:server'));
          ctx.timing.upstream.then(emitTiming('upstream:server'));
          ctx.timing.end.then(emitTiming('pageview:server'));
        }
      });
    } else {
      // TODO(#3): We should consider adding render/downstream/upstream timings for the browser
      ctx.element = (
        <Router
          basename={ctx.routePrefix}
          onRoute={payload => {
            if (emitter) emitter.emit('pageview:browser', payload);
          }}
        >
          {ctx.element}
        </Router>
      );
      return next();
    }
  };
}
