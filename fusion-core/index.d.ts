/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/// <reference types="node" />
import {Context as Context$1} from 'koa';
import {Server} from 'http';

declare type Token<T> = {
  optional: Token<undefined | T>;
  stacks: Array<{
    type:
      | 'token'
      | 'plugin'
      | 'register'
      | 'enhance'
      | 'alias-from'
      | 'alias-to';
    stack: string;
  }>;
  (): T;
};
declare type ExtendedKoaContext = Context$1 & {
  memoized: Map<any, unknown>;
};
declare type SanitizedHTMLWrapper = any;
declare type SSRContext = {
  element: any;
  template: {
    htmlAttrs: any;
    title: string;
    head: Array<SanitizedHTMLWrapper>;
    body: Array<SanitizedHTMLWrapper>;
    bodyAttrs: {
      [x: string]: string;
    };
  };
} & ExtendedKoaContext;
declare type Context = SSRContext | ExtendedKoaContext;
declare type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<any>;
declare type ExtractDepsType<T extends {}> = {
  [K in keyof T]: T[K] extends Token<infer R> ? R : never;
};
declare type FusionPluginDepsType =
  | Readonly<{
      [key: string]: Token<any>;
    }>
  | undefined;
declare type ExtractTokenType<T extends Token<any>> = T extends Token<infer R>
  ? R
  : never;
declare type FusionPlugin<Deps extends FusionPluginDepsType, Service> = {
  __plugin__: boolean;
  stack: string;
  deps?: Deps;
  provides?: (Deps: ExtractDepsType<Deps>) => Service;
  middleware?: (Deps: ExtractDepsType<Deps>, Service: Service) => Middleware;
  cleanup?: (service: Service) => Promise<void>;
};
declare type SSRDecider = (a: Context) => boolean;
declare type aliaser = {
  alias: <T>(sourceToken: Token<T>, destToken: Token<T>) => aliaser;
};
declare type cleanupFn = (thing?: any) => Promise<void>;
declare type SSRBodyTemplate = (a: Context) => Context['body'];
declare type RenderType = (b: any, a: Context) => any;
declare type RouteTagsType = {
  from: (ctx: Context) => {
    [x: string]: string;
  };
};

declare class BaseApp {
  constructor(el: any, render: any);
  registered: Map<
    any,
    {
      aliases?: Map<any, any>;
      enhancers?: Array<any>;
      token: any;
      value?: FusionPlugin<any, any>;
    }
  >;
  enhancerToToken: Map<any, any>;
  plugins: Array<any>;
  cleanups: Array<cleanupFn>;
  renderer: any;
  _getService: (a: any) => any;
  _dependedOn: Set<any>;
  register<T>(
    tokenOrValue: Token<T> | FusionPlugin<any, T>,
    maybeValue?: FusionPlugin<any, T> | T
  ): aliaser;
  _register<T>(token: Token<T>, value: any): aliaser;
  middleware<TDeps extends {} = {}>(
    deps: TDeps | Middleware,
    middleware?: (Deps: ExtractDepsType<TDeps>) => Middleware
  ): void;
  enhance<TResolved>(token: Token<TResolved>, enhancer: Function): void;
  cleanup(): Promise<any>;
  resolve<TResolved>(): void;
  getService<TResolved>(token: Token<TResolved>): TResolved;
  callback(...args: any[]): Promise<void> | any;
}

declare type Env = {
  rootDir: string;
  env: string;
  prefix: string;
  assetPath: string;
  baseAssetPath: string;
  cdnUrl: string;
  webpackPublicPath: string;
  dangerouslyExposeSourceMaps: boolean;
};
declare const _default: () => Env;

declare function compose(middleware: Array<Middleware>): Middleware;

declare type MemoizeFn<A> = (ctx: Context) => A;
declare function memoize<A>(fn: MemoizeFn<A>): MemoizeFn<A>;

declare const unescape: (str: string) => string;
declare const flowHtml: (
  strings: TemplateStringsArray,
  ...expressions: Array<string>
) => SanitizedHTMLWrapper;
declare const flowDangerouslySetHTML: (html: string) => any;
declare const flowConsumeSanitizedHTML: (str: SanitizedHTMLWrapper) => string;
declare const flowEscape: (str: string) => string;

declare function assetUrl(url: string): string;
declare function chunkId(filename: string): string;
declare function syncChunkIds(argument: any): any;
declare function syncChunkPaths(argument: any): any;
declare function workerUrl(url: string): string;

declare const RouteTagsToken: Token<RouteTagsType>;
declare const RenderToken: Token<RenderType>;
declare const ElementToken: Token<any>;
declare const SSRDeciderToken: Token<SSRDecider>;
declare const HttpServerToken: Token<Server>;
declare const SSRBodyTemplateToken: Token<SSRBodyTemplate>;
declare const RoutePrefixToken: Token<string>;
declare type CriticalChunkIds = Set<number>;
declare type CriticalChunkIdsService = {
  from(ctx: Context): CriticalChunkIds;
};
declare const CriticalChunkIdsToken: Token<CriticalChunkIdsService>;
declare const EnableMiddlewareTimingToken: Token<boolean>;

declare type FusionPluginNoHidden<
  TDeps extends FusionPluginDepsType,
  TService
> = Omit<FusionPlugin<TDeps, TService>, '__plugin__' | 'stack'>;
declare function createPlugin<
  TDeps extends FusionPluginDepsType,
  TService extends any
>(opts: FusionPluginNoHidden<TDeps, TService>): FusionPlugin<TDeps, TService>;

declare function createToken<TResolvedType>(name: string): Token<TResolvedType>;

interface FusionApp extends BaseApp {}
declare const FusionApp: typeof BaseApp;

export {
  Context,
  CriticalChunkIdsToken,
  ElementToken,
  EnableMiddlewareTimingToken,
  ExtractDepsType,
  ExtractTokenType,
  FusionApp,
  FusionPlugin,
  FusionPluginDepsType,
  HttpServerToken,
  MemoizeFn,
  Middleware,
  RenderType as Render,
  RenderToken,
  RoutePrefixToken,
  RouteTagsToken,
  RouteTagsType,
  SSRBodyTemplate,
  SSRBodyTemplateToken,
  SSRDeciderToken,
  Token,
  assetUrl,
  chunkId,
  compose,
  flowConsumeSanitizedHTML as consumeSanitizedHTML,
  createPlugin,
  createToken,
  flowDangerouslySetHTML as dangerouslySetHTML,
  FusionApp as default,
  flowEscape as escape,
  _default as getEnv,
  flowHtml as html,
  memoize,
  syncChunkIds,
  syncChunkPaths,
  unescape,
  workerUrl,
};
