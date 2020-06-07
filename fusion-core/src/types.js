/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context as KoaContext} from 'koa';

export type Token<T> = {
  (): T,
  optional: Token<void | T>,
  stacks: Array<{
    // eslint-disable-next-line
    type:
      | 'token'
      | 'plugin'
      | 'register'
      | 'enhance'
      | 'alias-from'
      | 'alias-to',
    stack: string,
  }>,
};

type ExtendedKoaContext = KoaContext & {memoized: Map<Object, mixed>};

export type SanitizedHTMLWrapper = Object;

export type SSRContext = {
  element: any,
  template: {
    htmlAttrs: Object,
    title: string,
    head: Array<SanitizedHTMLWrapper>,
    body: Array<SanitizedHTMLWrapper>,
    bodyAttrs: {[string]: string},
  },
} & ExtendedKoaContext;

export type Context = SSRContext | ExtendedKoaContext;

export type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<*>;

export type MiddlewareWithDeps<Deps> = (
  Deps: $ObjMap<Deps, ExtractTokenType>
) => Middleware;

export type ExtractTokenType = <V>(Token<V>) => V;

export type ExtractDepsType<V> = $ObjMap<V, ExtractTokenType>;

export type FusionPlugin<Deps, Service> = {|
  __plugin__: boolean,
  stack: string,
  deps?: Deps,
  provides?: (Deps: $ObjMap<Deps & {}, ExtractTokenType>) => Service,
  middleware?: (
    Deps: $ObjMap<Deps & {}, ExtractTokenType>,
    Service: Service
  ) => Middleware,
  cleanup?: (service: Service) => Promise<void>,
|};

export type SSRDecider = Context => boolean;

export type aliaser<TToken> = {
  alias: (sourceToken: TToken, destToken: TToken) => aliaser<TToken>,
};

export type cleanupFn = (thing: any) => Promise<void>;

export type SSRBodyTemplate = Context => $PropertyType<Context, 'body'>;

export type RenderType = (any, Context) => any;

export type RouteTagsType = {
  from: (ctx: Context) => {[string]: string},
};
