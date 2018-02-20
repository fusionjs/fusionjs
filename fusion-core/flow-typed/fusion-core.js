/* @flow */
import type {Context as KoaContext} from 'koa';

// TODO(#61): Type checking here isn't very good, as it allows you to
// alias tokens that are not of the exact same type.
type aliaser<Token> = {
  alias: (sourceToken: Token, destToken: Token) => aliaser<*>,
};

type cleanupFn = (thing: any) => Promise<any>;

type ExtractReturnType = <V>(() => V) => V;

declare module 'fusion-core' {
  declare var __NODE__: Boolean;
  declare var __BROWSER__: Boolean;
  declare export type SSRContext = {
    element: any,
    template: {
      htmlAttrs: Object,
      title: string,
      head: Array<string | SanitizedHTMLWrapper>,
      body: Array<string>,
    },
  } & KoaContext;
  declare export type Token<T> = {
    (): T,
    optional: () => void | T,
  };
  declare export type Context = SSRContext | KoaContext;
  declare export type FusionPlugin<Deps, Service> = {
    deps?: Deps,
    provides?: (Deps: $ObjMap<Deps, ExtractReturnType>) => Service,
    middleware?: (
      Deps: $ObjMap<Deps, ExtractReturnType>,
      Service: Service
    ) => Middleware,
    cleanup?: (service: Service) => Promise<any>,
  };
  declare export type Middleware = (
    ctx: Context,
    next: () => Promise<void>
  ) => Promise<*>;
  declare type MemoizeFn<A> = (ctx: Context) => A;
  declare export function memoize<A>(fn: MemoizeFn<A>): MemoizeFn<A>;
  declare class FusionApp {
    constructor<Element>(element: Element, render: *): FusionApp;
    cleanups: Array<cleanupFn>;
    registered: Map<any, any>;
    plugins: Array<any>;
    renderer: any;
    cleanup(): Promise<any>;
    enhance<Token, Deps>(token: Token, enhancer: Function): void;
    register: any;
    // register<Deps, Provides>(Plugin: FusionPlugin<Deps, Provides>): aliaser<*>;
    // register<Token, Deps>(
    //   token: Token,
    //   Plugin: FusionPlugin<Deps, $Call<ExtractReturnType, Token>>
    // ): aliaser<*>;
    // register<Token: Object>(
    //   token: Token,
    //   val: $Call<ExtractReturnType, Token>
    // ): aliaser<*>;
    middleware<Deps>(
      deps: Deps,
      middleware: (Deps: $ObjMap<Deps, ExtractReturnType>) => Middleware
    ): void;
    middleware(middleware: Middleware): void;
    callback(): () => Promise<void>;
    resolve(): void;
  }
  declare export default typeof FusionApp
  declare export function createPlugin<Deps, Service>(
    options: FusionPlugin<Deps, Service>
  ): FusionPlugin<Deps, Service>;
  declare export function createToken(name: string): Token<any>;
  declare export type SanitizedHTMLWrapper = Object;
  declare export function html(
    strings: Array<string>,
    ...expressions: Array<string>
  ): SanitizedHTMLWrapper;
  declare export function assetUrl(str: string): string;
  declare export function consumeSanitizedHTML(str: string): string;
  declare export function dangerouslySetHTML(html: string): Object;
  declare export function escape(str: string): string;
  declare export function unescape(str: string): string;
  declare export var RenderToken: (Element: any) => string;
  declare export var ElementToken: any;
}
