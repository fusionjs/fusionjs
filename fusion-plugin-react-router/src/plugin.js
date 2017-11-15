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
import {html, unescape} from 'fusion-core';

const Router = __NODE__ ? ServerRouter : BrowserRouter;
export default function getRouter({UniversalEvents}) {
  return function middleware(ctx, next) {
    const emitter = UniversalEvents ? UniversalEvents.of(ctx) : null;
    if (__NODE__) {
      let pageData = {
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
            onRoute={d => {
              pageData = d;
            }}
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
        ctx.body.body.push(
          html`<script id="__ROUTER_DATA__" type="application/json">${JSON.stringify(
            pageData
          )}</script>`
        );
        if (emitter) {
          const emitTiming = type => timing => {
            emitter.emit(type, {
              title: pageData.title,
              page: pageData.page,
              status: ctx.status,
              timing,
            });
          };
          emitter.map(payload => {
            if (payload) {
              payload.__url__ = pageData.title;
            }
            return payload;
          });
          ctx.timing.downstream.then(emitTiming('downstream:server'));
          ctx.timing.render.then(emitTiming('render:server'));
          ctx.timing.upstream.then(emitTiming('upstream:server'));
          ctx.timing.end.then(emitTiming('pageview:server'));
        }
      });
    } else if (__BROWSER__) {
      // TODO(#3): We should consider adding render/downstream/upstream timings for the browser
      let pageData = JSON.parse(
        unescape(document.getElementById('__ROUTER_DATA__').textContent)
      );
      if (emitter) {
        emitter.map(payload => {
          if (payload) {
            payload.__url__ = pageData.title;
          }
          return payload;
        });
      }
      ctx.element = (
        <Router
          basename={ctx.routePrefix}
          onRoute={payload => {
            pageData = payload;
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
