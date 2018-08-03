/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin, createToken, html, unescape, memoize} from 'fusion-core';
import {Router as ServerRouter} from './server';
import {Router as BrowserRouter} from './browser';
import {Router as DefaultProvider} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';
import {createServerHistory} from './modules/ServerHistory';
import type {HistoryType} from './types';
import type {Token, Context} from 'fusion-core';

type ProviderPropsType = {
  history: HistoryType,
  basename: string,
};
type HistoryWrapperType = {
  from: (
    ctx: Context
  ) => {
    history: HistoryType,
  },
};

export const RouterProviderToken: Token<
  React.ComponentType<ProviderPropsType>
> = createToken('RouterProvider');

export const RouterToken: Token<HistoryWrapperType> = createToken('Router');

const Router = __NODE__ ? ServerRouter : BrowserRouter;

export default createPlugin({
  deps: {
    emitter: UniversalEventsToken.optional,
    Provider: RouterProviderToken.optional,
  },
  middleware: ({emitter, Provider = DefaultProvider}, self) => {
    return async (ctx, next) => {
      const prefix = ctx.prefix || '';
      if (!ctx.element) {
        return next();
      }
      const myAPI = self.from(ctx);
      if (__NODE__) {
        let pageData = {
          title: ctx.path,
          page: ctx.path,
        };
        const context = {
          action: null,
          location: null,
          url: null,
          setCode: code => {
            ctx.status = code;
          },
          redirect: url => {
            ctx.redirect(url);
          },
        };
        // Expose the history object
        const history = createServerHistory(prefix, context, prefix + ctx.url);
        myAPI.history = history;
        ctx.element = (
          <Router
            history={history}
            Provider={Provider}
            onRoute={d => {
              pageData = d;
            }}
            basename={prefix}
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

          if (emitter) {
            const emitTiming = type => timing => {
              emitter.emit(type, {
                title: pageData.title,
                page: pageData.page,
                status: ctx.status,
                timing,
              });
            };
            emitter.from(ctx).map(payload => {
              if (payload && typeof payload === 'object') {
                payload.__url__ = pageData.title;
              }
              return payload;
            });
            ctx.timing.end.then(timing => {
              emitTiming('pageview:server')(timing);
              ctx.timing.render.then(emitTiming('render:server'));
            });
          }
        });
      } else if (__BROWSER__) {
        // TODO(#3): We should consider adding render/downstream/upstream timings for the browser
        let pageData = {};
        const element = document.getElementById('__ROUTER_DATA__');
        if (element) {
          pageData = JSON.parse(unescape(element.textContent));
        }
        emitter &&
          emitter.map(payload => {
            if (payload && typeof payload === 'object') {
              payload.__url__ = pageData.title;
            }
            return payload;
          });
        // Expose the history object
        const history = createBrowserHistory({basename: ctx.prefix});
        myAPI.history = history;
        ctx.element = (
          <Router
            history={history}
            Provider={Provider}
            basename={ctx.prefix}
            onRoute={payload => {
              pageData = payload;
              emitter && emitter.emit('pageview:browser', payload);
            }}
          >
            {ctx.element}
          </Router>
        );
        return next();
      }
    };
  },
  provides() {
    return {
      from: memoize(() => {
        const api: {history: HistoryType} = ({
          history: null,
        }: any);
        return api;
      }),
    };
  },
});
