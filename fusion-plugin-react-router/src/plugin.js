/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Router as DefaultProvider} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';

import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {createPlugin, createToken, html, unescape, memoize} from 'fusion-core';
import type {Token, Context, FusionPlugin} from 'fusion-core';

import {Router as ServerRouter} from './server.js';
import {Router as BrowserRouter} from './browser.js';
import {createServerHistory} from './modules/ServerHistory.js';
import {addRoutePrefix} from './modules/utils.js';
import type {RouterHistoryType} from './types.js';

type ProviderPropsType = {
  history: RouterHistoryType,
  basename?: string,
  children?: React.Node,
};

type HistoryWrapperType = {
  from: (
    ctx: Context
  ) => {
    history: RouterHistoryType,
  },
};

export const RouterProviderToken: Token<
  React.ComponentType<ProviderPropsType>
> = createToken('RouterProvider');

export const RouterToken: Token<HistoryWrapperType> = createToken('Router');

const Router = __NODE__ ? ServerRouter : BrowserRouter;

type PluginDepsType = {
  emitter: typeof UniversalEventsToken.optional,
  Provider: typeof RouterProviderToken.optional,
};

// Preserve browser history instance across HMR
let browserHistory;

const plugin: FusionPlugin<PluginDepsType, HistoryWrapperType> = createPlugin({
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
          redirect: (url: string) => {
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
                title: pageData.title,
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
        }
        emitter &&
          emitter.map(payload => {
            if (payload && typeof payload === 'object') {
              payload.__url__ = pageData.title;
              payload.__urlParams__ = pageData.params;
            }
            return payload;
          });
        // Expose the history object
        if (!browserHistory) {
          browserHistory = createBrowserHistory({basename: ctx.prefix});
        }
        myAPI.history = browserHistory;
        ctx.element = (
          <Router
            history={browserHistory}
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
        const api: {history: RouterHistoryType} = ({
          history: null,
        }: any);
        return api;
      }),
    };
  },
});

export default plugin;
