/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable require-yield */
import {createPlugin, declarePlugin, getPluginFn} from './create-plugin';
import {createToken, getTokenRef, TokenImpl} from './create-token';
import {
  ElementToken,
  RenderToken,
  SSRDeciderToken,
  RouteTagsToken,
  EnableMiddlewareTimingToken,
} from './tokens';
import {SSRDecider} from './plugins/ssr';
import RouteTagsPlugin from './plugins/route-tags';
import {captureStackTrace, DIError} from './stack-trace';

import {App as Core, getResolvedDep} from './core';
import {sortLegacy} from './legacy-compat';

import type {
  aliaser,
  ExtractDepsType,
  FusionPlugin,
  Middleware,
  Token,
} from './types';

class BaseApp extends Core {
  constructor(el: any, render: any) {
    super();
    this.registered = new Map(); // getTokenRef(token) -> {value, aliases, enhancers}
    this.plugins = []; // Token
    el && this.register(ElementToken, el);
    if (render) {
      this.renderer = render;
    }
    this.register(SSRDeciderToken, SSRDecider);
    this.register(RouteTagsToken, RouteTagsPlugin);
    this.done = false;
  }

  // eslint-disable-next-line
  registered: Map<any, {
      aliases?: Map<any, any>;
      enhancers?: Array<any>;
      token: any;
      value?: FusionPlugin<any, any>;
    }
  >;
  enhancerToToken: Map<any, any>;
  plugins: Array<any>;
  renderer: any;
  _getService: (a: any) => any;
  _dependedOn: Set<any>;
  done: boolean;
  enableMiddlewareTiming: boolean;

  register<T>(
    tokenOrValue: Token<T> | FusionPlugin<any, T>,
    maybeValue?: FusionPlugin<any, T> | T
  ): aliaser {
    const hasToken = tokenOrValue instanceof TokenImpl;
    const token = hasToken
      ? (tokenOrValue as any as Token<T>)
      : createToken<T>('UnnamedPlugin');
    const value: any = hasToken ? maybeValue : tokenOrValue;
    if (!hasToken && (value == null || !getPluginFn(value))) {
      throw new DIError({
        message: __DEV__
          ? `Cannot register ${String(
              tokenOrValue
            )} without a token. Did you accidentally register a ${
              __NODE__ ? 'browser' : 'server'
            } plugin on the ${__NODE__ ? 'server' : 'browser'}?`
          : 'Invalid configuration registration',
        errorDoc: 'value-without-token',
        caller: this.register,
      });
    }
    // the renderer is a special case, since it needs to be always run last
    if (token === RenderToken) {
      this.renderer = value;
      const alias = () => {
        throw new DIError({
          message: 'Aliasing for RenderToken not supported',
          caller: alias,
        });
      };
      return {alias};
    }
    token.stacks.push({
      type: 'register',
      stack: captureStackTrace(this.register),
    });
    if (value && value.__plugin__) {
      token.stacks.push({type: 'plugin', stack: value.stack});
    }
    return this._register<T>(token, value);
  }

  _register<T>(token: Token<T>, value: any): aliaser {
    const foundPluginFn = getPluginFn(value);

    // const registerResult = super.registerPlugin(token, value);

    const registerResult = super.registerPlugin(
      token,
      foundPluginFn
        ? foundPluginFn
        : declarePlugin(function* () {
            return value;
          })
    );

    // getPluginFn(valaue)
    //   ? super.registerPlugin(token, value.__fn__)
    //   : super.registerPlugin(
    //       token,
    //       declarePlugin(function* () {
    //         return value;
    //       })
    //     );

    // For introspect plugin
    const {aliases, enhancers} = this.registered.get(getTokenRef(token)) || {
      aliases: new Map(),
      enhancers: [],
    };
    this.registered.set(getTokenRef(token), {
      value,
      aliases,
      enhancers,
      token,
    });

    const alias = (sourceToken, destToken) => {
      registerResult.alias(sourceToken, destToken);
      const stack = captureStackTrace(alias);
      sourceToken.stacks.push({type: 'alias-from', stack});
      destToken.stacks.push({type: 'alias-to', stack});
      return {alias};
    };
    return {alias};
  }

  middleware<TDeps extends {} = {}>(
    deps: TDeps | Middleware,
    middleware?: (Deps: ExtractDepsType<TDeps>) => Middleware
  ) {
    if (middleware === undefined) {
      middleware = () => deps as any as Middleware;
    }
    this.register(createPlugin({deps: deps as any as TDeps, middleware}));
  }

  enhance<TResolved>(token: Token<TResolved>, enhancer: Function) {
    token.stacks.push({
      type: 'enhance',
      stack: captureStackTrace(this.enhance),
    });

    // For introspect plugin
    const {value, aliases, enhancers} = this.registered.get(
      getTokenRef(token)
    ) || {
      aliases: new Map(),
      enhancers: [],
      value: undefined,
    };

    if (enhancers && Array.isArray(enhancers)) {
      // @ts-ignore (Remove once references are used)
      enhancers.push(enhancer);
    }
    this.registered.set(getTokenRef(token), {
      value,
      aliases,
      enhancers,
      token,
    });

    return super.enhance(token, enhancer);
  }

  cleanup(): Promise<any> {
    return Promise.all(this.cleanups.map((fn) => fn()));
  }

  resolve() {
    if (!this.renderer) {
      throw new Error('Missing registration for RenderToken');
    }
    this._register(RenderToken, this.renderer);

    if (this.registeredTokens.has(getTokenRef(EnableMiddlewareTimingToken))) {
      this.enableMiddlewareTiming = true;
    }

    // Note that core init actually returns a promise.
    // However, core init will synchronously complete as long as there is no
    // async tasks. The only planned async hook is withStartup(), which is not
    // currently implemented. Introducing async startup is technically a
    // breaking change, which we are avoiding initially. When we want to make
    // this breaking change and introduce withStartup(), we should add an await
    // to the statement below
    super.init();

    sortLegacy(this); // Preserve legacy order for compatibility

    this.done = true;
  }

  // @ts-ignore (Remove once references are used)
  getService<TResolved>(token: Token<TResolved>): TResolved {
    if (!this.done) {
      throw new DIError({
        message: 'Cannot get service from unresolved app',
        caller: this.getService,
      });
    }
    const result = getResolvedDep(this, token);
    if (result.resolved) {
      return result.value;
    }
  }

  callback(...args: any[]): Promise<void> | any {}
}

export default BaseApp;
