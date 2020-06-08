/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Router as DefaultProvider} from 'react-router-dom';
import {createBrowserHistory} from 'history';

import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {
  createPlugin,
  createToken,
  html,
  unescape,
  memoize,
  RouteTagsToken,
} from 'fusion-core';
import type {Token, Context, FusionPlugin} from 'fusion-core';

import {Router as ServerRouter} from './server.js';
import {Router as BrowserRouter} from './browser.js';
import {createServerHistory} from './modules/ServerHistory.js';

import {addRoutePrefix} from './modules/utils.js';
import type {RouterHistoryType, StaticContextType} from './types.js';

type ProviderPropsType = {
  history: RouterHistoryType,
  children?: React.Node,
};

type HistoryWrapperType = {
  from: (
    ctx: Context
  ) => {
    history: RouterHistoryType,
  },
};

export const GetStaticContextToken = createToken<
  (ctx: Context) => StaticContextType
>('GetStaticContext');

export const RouterProviderToken: Token<
  React.ComponentType<ProviderPropsType>
> = createToken('RouterProvider');

export const RouterToken: Token<HistoryWrapperType> = createToken('Router');

const Router = __NODE__ ? ServerRouter : BrowserRouter;

type PluginDepsType = {
  getStaticContext: typeof GetStaticContextToken.optional,
  emitter: typeof UniversalEventsToken.optional,
  Provider: typeof RouterProviderToken.optional,
  RouteTags: typeof RouteTagsToken,
};

// Preserve browser history instance across HMR
let browserHistory;
let noMatchingRoute = 'no-matching-route';

const plugin: FusionPlugin<PluginDepsType, HistoryWrapperType> = createPlugin({
  deps: {
    emitter: UniversalEventsToken.optional,
    Provider: RouterProviderToken.optional,
    getStaticContext: GetStaticContextToken.optional,
    RouteTags: RouteTagsToken,
  },
  middleware: (
    {RouteTags, emitter, Provider = DefaultProvider, getStaticContext},
    self
  ) => {
    return async (ctx, next) => {
      const tags = RouteTags.from(ctx);
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
        const context = getStaticContext
          ? getStaticContext(ctx)
          : {
              action: null,
              location: null,
              set status(code: number) {
                ctx.status = code;
              },
              set url(url: string) {
                const toUrl = addRoutePrefix(url, prefix);
                if (typeof toUrl === 'string') {
                  ctx.redirect(toUrl);
                }
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
              tags.name = pageData.title;
              tags.page = pageData.page;
              pageData.routeMatched = true;
            }}
            basename={prefix}
            context={context}
          >
            {ctx.element}
          </Router>
        );
        return next().then(() => {
          ctx.template.body.push(
            html`
              <script id="__ROUTER_DATA__" type="application/json">
                ${JSON.stringify(pageData)}
              </script>
            `
          );

          if (emitter) {
            const scopedEmitter = emitter.from(ctx);
            const emitTiming = type => timing => {
              scopedEmitter.emit(type, {
                title: pageData.routeMatched ? pageData.title : noMatchingRoute,
                page: pageData.page,
                status: ctx.status,
                timing,
              });
            };
            scopedEmitter.map(payload => {
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
          tags.name = pageData.title;
          tags.page = pageData.page;
        }
        emitter &&
          emitter.map(payload => {
            if (payload && typeof payload === 'object') {
              if (pageData.routeMatched) {
                payload.__url__ = pageData.title;
                payload.__urlParams__ = pageData.params;
                delete pageData.routeMatched;
              } else {
                payload.__url__ = noMatchingRoute;
                payload.__urlParams__ = {};
              }
            }
            return payload;
          });
        // preserving browser history across hmr fixes warning "Warning: You cannot change <Router history>"
        // we don't want to preserve the `browserHistory` instance across jsdom tests however, as it will cause
        // routes to match based on the previous location information.
        if (
          !browserHistory ||
          (__DEV__ && typeof window.jsdom !== 'undefined')
        ) {
          browserHistory = createBrowserHistory({basename: ctx.prefix});
        }
        // Expose the history object
        myAPI.history = browserHistory;
        ctx.element = (
          <Router
            history={browserHistory}
            Provider={Provider}
            basename={ctx.prefix}
            onRoute={payload => {
              payload.routeMatched = true;
              pageData = payload;
              tags.name = pageData.title;
              tags.page = pageData.page;
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
        const api: {history: RouterHistoryType} = ({
          history: null,
        }: any);
        return api;
      }),
    };
  },
});

export default plugin;
