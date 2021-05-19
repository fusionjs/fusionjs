/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {createPlugin} from './create-plugin';
import {createToken, TokenType, TokenImpl} from './create-token';
import {
  ElementToken,
  RenderToken,
  SSRDeciderToken,
  RouteTagsToken,
  EnableMiddlewareTimingToken,
} from './tokens';
import {SSRDecider} from './plugins/ssr';
import RouteTagsPlugin from './plugins/route-tags';
import {captureStackTrace, DIError} from './stack-trace.js';
import wrapMiddleware from './utils/wrap-middleware.js';

import type {
  aliaser,
  cleanupFn,
  Context,
  FusionPlugin,
  Middleware,
  Token,
} from './types.js';

interface Register<T> {
  (Token<T>, mixed): aliaser<Token<T>>;
  (mixed): aliaser<Token<T>>;
}

class FusionApp {
  constructor(el: Element | string, render: any => any) {
    this.registered = new Map(); // getTokenRef(token) -> {value, aliases, enhancers}
    this.enhancerToToken = new Map(); // enhancer -> token
    this._dependedOn = new Set();
    this.plugins = []; // Token
    this.cleanups = [];
    el && this.register(ElementToken, el);
    render && this.register(RenderToken, render);
    this.register(SSRDeciderToken, SSRDecider);
    this.register(RouteTagsToken, RouteTagsPlugin);
  }

  // eslint-disable-next-line
  registered: Map<
    any,
    {
      aliases?: Map<any, any>,
      enhancers?: Array<any>,
      token: any,
      value?: FusionPlugin<*, *>,
    }
  >;
  enhancerToToken: Map<any, any>;
  plugins: Array<any>;
  cleanups: Array<cleanupFn>;
  renderer: any;
  _getService: any => any;
  _dependedOn: Set<any>;

  register: Register<*> = <T>(tokenOrValue, maybeValue) => {
    const hasToken = tokenOrValue instanceof TokenImpl;
    const token = hasToken
      ? ((tokenOrValue: any): Token<T>)
      : createToken('UnnamedPlugin');
    const value: any = hasToken ? maybeValue : tokenOrValue;
    if (!hasToken && (value == null || !value.__plugin__)) {
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
    return this._register(token, value);
  };
  _register<TResolved>(token: Token<TResolved>, value: *) {
    this.plugins.push(token);
    const {aliases, enhancers} = this.registered.get(getTokenRef(token)) || {
      aliases: new Map(),
      enhancers: [],
    };
    if (value && value.__plugin__) {
      if (value.deps) {
        Object.values(value.deps).forEach(token =>
          this._dependedOn.add(getTokenRef(token))
        );
      }
    }
    this.registered.set(getTokenRef(token), {
      value,
      aliases,
      enhancers,
      token,
    });
    const alias = (sourceToken, destToken) => {
      const stack = captureStackTrace(alias);
      sourceToken.stacks.push({type: 'alias-from', stack});
      destToken.stacks.push({type: 'alias-to', stack});
      this._dependedOn.add(getTokenRef(destToken));
      if (aliases) {
        aliases.set(getTokenRef(sourceToken), destToken);
      }
      return {alias};
    };
    return {alias};
  }
  middleware(deps: *, middleware: *) {
    if (middleware === undefined) {
      middleware = () => deps;
    }
    this.register(createPlugin({deps, middleware}));
  }
  enhance<TResolved>(token: Token<TResolved>, enhancer: Function) {
    token.stacks.push({
      type: 'enhance',
      stack: captureStackTrace(this.enhance),
    });
    const {value, aliases, enhancers} = this.registered.get(
      getTokenRef(token)
    ) || {
      aliases: new Map(),
      enhancers: [],
      value: undefined,
    };
    this.enhancerToToken.set(enhancer, token);

    if (enhancers && Array.isArray(enhancers)) {
      enhancers.push(enhancer);
    }
    this.registered.set(getTokenRef(token), {
      value,
      aliases,
      enhancers,
      token,
    });
  }
  cleanup() {
    return Promise.all(this.cleanups.map(fn => fn()));
  }
  resolve<TResolved>() {
    if (!this.renderer) {
      throw new Error('Missing registration for RenderToken');
    }
    this._register(RenderToken, this.renderer);
    const resolved = new Map(); // Token.ref || Token => Service
    const nonPluginTokens = new Set(); // Token
    const resolving = new Set(); // Token.ref || Token
    const registered = this.registered; // Token.ref || Token -> {value, aliases, enhancers}
    const resolvedPlugins = []; // Plugins
    const appliedEnhancers = [];
    const enableMiddlewareTiming = this.registered.has(
      getTokenRef(EnableMiddlewareTimingToken)
    );
    const resolveToken = (token: Token<TResolved>, tokenAliases) => {
      // Base: if we have already resolved the type, return it
      if (tokenAliases && tokenAliases.has(getTokenRef(token))) {
        const newToken = tokenAliases.get(getTokenRef(token));
        if (newToken) {
          token = newToken;
        }
      }
      if (resolved.has(getTokenRef(token))) {
        return resolved.get(getTokenRef(token));
      }

      // Base: if currently resolving the same type, we have a circular dependency
      if (resolving.has(getTokenRef(token))) {
        const registerStack = token.stacks.find(t => t.type === 'register');
        throw new DIError({
          message: `Cannot resolve circular dependency: ${token.name}`,
          errorDoc: 'circular-dependencies',
          stack: registerStack && registerStack.stack,
        });
      }

      // Base: the type was never registered, throw error or provide undefined if optional
      let {value, aliases, enhancers} =
        registered.get(getTokenRef(token)) || {};
      if (value === undefined) {
        // Early return if token is optional
        const isOptional =
          token instanceof TokenImpl && token.type === TokenType.Optional;
        if (isOptional && (!enhancers || !enhancers.length)) {
          return;
        }
        const dependents = Array.from(this.registered.entries());

        /**
         * Iterate over the entire list of dependencies and find all
         * dependencies of a given token.
         */
        const findDependentTokens = () => {
          return dependents
            .filter(entry => {
              if (!entry[1].value || !entry[1].value.deps) {
                return false;
              }
              return Object.values(entry[1].value.deps).includes(token);
            })
            .map(entry => entry[1].token.name);
        };
        const findDependentEnhancers = () => {
          return appliedEnhancers
            .filter(([, provides]) => {
              if (!provides || !provides.deps) {
                return false;
              }
              return Object.values(provides.deps).includes(token);
            })
            .map(([enhancer]) => {
              const enhancedToken = this.enhancerToToken.get(enhancer);
              return `EnhancerOf<${
                enhancedToken ? enhancedToken.name : '(unknown)'
              }>`;
            });
        };
        const dependentTokens = [
          ...findDependentTokens(),
          ...findDependentEnhancers(),
        ];

        const duplicates = this.plugins
          .filter(p => p.name === token.name)
          .map(p => {
            const stack = p.stacks.find(t => t.type === 'token');
            return stack.stack;
          });
        const tokenStack = token.stacks.find(t => t.type === 'token');
        if (duplicates.length) {
          // Note: Update when string token equality is implemented
          throw new DIError({
            message: `Missing registration for token "${token.name}". Other tokens with this name have been registered`,
            stack: tokenStack && tokenStack.stack,
            errorDoc: 'duplicate-token-names',
          });
        } else {
          const dependentList = dependentTokens
            .map(token => `"${token}"`)
            .join(', ');
          const plural = dependentTokens.length > 1 ? 's' : '';
          throw new DIError({
            message: `Missing registration for token "${token.name}". This token is a required dependency of the plugin${plural} registered to ${dependentList} token${plural}`,
            stack: tokenStack && tokenStack.stack,
            errorDoc: 'missing-registration',
          });
        }
      }

      // Recursive: get the registered type and resolve it
      resolving.add(getTokenRef(token));

      function resolvePlugin(plugin) {
        const registeredDeps = (plugin && plugin.deps) || {};
        const resolvedDeps = {};
        for (const key in registeredDeps) {
          const registeredToken = registeredDeps[key];
          resolvedDeps[key] = resolveToken(registeredToken, aliases);
        }
        // `provides` should be undefined if the plugin does not have a `provides` function
        let provides =
          plugin && plugin.provides ? plugin.provides(resolvedDeps) : undefined;
        if (plugin && plugin.middleware) {
          const resolvedMiddleware = plugin.middleware(resolvedDeps, provides);
          resolvedPlugins.push(
            enableMiddlewareTiming
              ? wrapMiddleware(resolvedMiddleware, token, plugin)
              : resolvedMiddleware
          );
        }
        return provides;
      }

      let provides = value;
      if (value && value.__plugin__) {
        provides = resolvePlugin(provides);
        if (value.cleanup) {
          this.cleanups.push(function() {
            return typeof value.cleanup === 'function'
              ? value.cleanup(provides)
              : Promise.resolve();
          });
        }
      } else {
        nonPluginTokens.add(token);
      }

      if (enhancers && enhancers.length) {
        enhancers.forEach(e => {
          let nextProvides = e(provides);
          appliedEnhancers.push([e, nextProvides]);
          if (nextProvides && nextProvides.__plugin__) {
            // if the token has a plugin enhancer, allow it to be registered with no dependents
            nonPluginTokens.delete(token);
            if (nextProvides.deps) {
              Object.values(nextProvides.deps).forEach(token =>
                this._dependedOn.add(getTokenRef(token))
              );
            }
            nextProvides = resolvePlugin(nextProvides);
          }
          provides = nextProvides;
        });
      }
      resolved.set(getTokenRef(token), provides);
      resolving.delete(getTokenRef(token));
      return provides;
    };

    for (let i = 0; i < this.plugins.length; i++) {
      resolveToken(this.plugins[i]);
    }
    for (const token of nonPluginTokens) {
      if (
        token !== ElementToken &&
        token !== RenderToken &&
        token !== EnableMiddlewareTimingToken &&
        !this._dependedOn.has(getTokenRef(token))
      ) {
        const registerStack = token.stacks.find(t => t.type === 'register');
        throw new DIError({
          message: `Registered token without depending on it: ${token.name}`,
          errorDoc: 'registered-without-depending',
          stack: registerStack && registerStack.stack,
        });
      }
    }

    this.plugins = resolvedPlugins;
    this._getService = token => resolved.get(getTokenRef(token));
  }
  getService<TResolved>(token: Token<TResolved>): any {
    if (!this._getService) {
      throw new DIError({
        message: 'Cannot get service from unresolved app',
        caller: this.getService,
      });
    }
    return this._getService(token);
  }
}

/* Helper functions */
function getTokenRef(token) {
  if (token instanceof TokenImpl) {
    return token.ref;
  }
  return token;
}

export default FusionApp;
