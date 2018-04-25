// @flow

import type {Context as KoaContext} from 'koa';

export type Token<T> = {
  (): T,
  optional: () => void | T,
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
  },
} & ExtendedKoaContext;

export type Context = SSRContext | ExtendedKoaContext;

export type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<*>;

export type MiddlewareWithDeps<Deps> = (
  // $FlowFixMe
  Deps: $ObjMap<Deps, ExtractReturnType>
) => Middleware;

export type ExtractReturnType = <V>(() => V) => V;

export type FusionPlugin<Deps, Service> = {
  __plugin__?: boolean,
  deps?: Deps,
  // $FlowFixMe
  provides?: (Deps: $ObjMap<Deps & {}, ExtractReturnType>) => Service,
  middleware?: (
    // $FlowFixMe
    Deps: $ObjMap<Deps & {}, ExtractReturnType>,
    Service: Service
  ) => Middleware,
  cleanup?: (service: Service) => Promise<void>,
};

export type aliaser<Token> = {
  alias: (sourceToken: Token, destToken: Token) => aliaser<Token>,
};

export type cleanupFn = (thing: any) => Promise<void>;
