/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import React from 'react';
import {createPlugin, html, unescape} from 'fusion-core';
import {Router as ServerRouter} from './server';
import {Router as BrowserRouter} from './browser';

const Router = __NODE__ ? ServerRouter : BrowserRouter;
export default createPlugin({
  deps: {
    emitter: UniversalEventsToken,
  },
  middleware: ({emitter}) => {
    return (ctx, next) => {
      if (!ctx.element) {
        return next();
      }
      if (__NODE__) {
        let pageData = {
          title: ctx.path,
          page: ctx.path,
        };
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
        return next().then(() => {
          ctx.template.body.push(
            html`<script id="__ROUTER_DATA__" type="application/json">${JSON.stringify(
              pageData
            )}</script>`
          );
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
          ctx.timing.render.then(emitTiming('render:server'));
          ctx.timing.end.then(emitTiming('pageview:server'));
        });
      } else if (__BROWSER__) {
        // TODO(#3): We should consider adding render/downstream/upstream timings for the browser
        let pageData = {};
        const element = document.getElementById('__ROUTER_DATA__');
        if (element) {
          pageData = JSON.parse(unescape(element.textContent));
        }
        emitter.map(payload => {
          if (payload) {
            payload.__url__ = pageData.title;
          }
          return payload;
        });
        ctx.element = (
          <Router
            basename={ctx.routePrefix}
            onRoute={payload => {
              pageData = payload;
              emitter.emit('pageview:browser', payload);
            }}
          >
            {ctx.element}
          </Router>
        );
        return next();
      }
    };
  },
});
