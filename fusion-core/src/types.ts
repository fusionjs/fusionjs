/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Context as KoaContext} from 'koa';

export type Token<T> = {
  optional: Token<undefined | T>;
  stacks: Array<{
    // eslint-disable-next-line
    type: "token" | "plugin" | "register" | "enhance" | "alias-from" | "alias-to"
    stack: string;
  }>;
  (): T;
};

type ExtendedKoaContext = KoaContext & {
  memoized: Map<any, unknown>;
};

export type SanitizedHTMLWrapper = any;

export type SSRContext = {
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

export type Context = SSRContext | ExtendedKoaContext;

export type Middleware = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<any>;

export type MiddlewareWithDeps<Deps extends FusionPluginDepsType> = (
  Deps: ExtractDepsType<Deps>
) => Middleware;

export type ExtractDepsType<T extends FusionPluginDepsType> = {
  [K in keyof T]: T[K] extends Token<infer R> ? ExtractServiceType<R> : never;
};

export type FusionPluginDepsType =
  | Readonly<{
      [key: string]: Token<any>;
    }>
  | undefined;

export type ExtractTokenType<T extends Token<any>> = T extends Token<infer R>
  ? R
  : never;

export type ExtractServiceType<P> = P extends FusionPlugin<infer D, infer S>
  ? S
  : P;

export type FusionPlugin<Deps extends FusionPluginDepsType, Service> = {
  __plugin__: boolean;
  stack: string;
  deps?: Deps;
  provides?: (Deps: ExtractDepsType<Deps>) => Service;
  middleware?: (Deps: ExtractDepsType<Deps>, Service: Service) => Middleware;
  cleanup?: (service: Service) => Promise<void> | void;
  __fn__?: any;
};

export type SSRDecider = (a: Context) => boolean | 'stream';

export type aliaser = {
  alias: <T>(sourceToken: Token<T>, destToken: Token<T>) => aliaser;
};

export type cleanupFn = (thing?: any) => Promise<void> | void;

export type SSRBodyTemplate = (a: Context) => Context['body'];

export type SSRShellTemplate = (a: Context) => {
  start: string;
  end: string;
  scripts: Array<string>;
  useModuleScripts: boolean;
};

export type unstable_EnableServerStreamingTokenType = boolean;

export type RenderType = (b: any, a: Context) => any;

export type RouteTagsType = {
  from: (ctx: Context) => {
    [x: string]: string;
  };
};

export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
};

export type MiddlewareTiming = {
  token: string;
  source: string;
  downstream: number;
  upstream: number;
};

export type PrepassTiming = {
  duration: number;
  pendingSize: number;
};

export interface TimingInterface {
  start: number;
  render: Deferred<number>;
  end: Deferred<number>;
  downstream: Deferred<number>;
  upstream: Deferred<number>;
  upstreamStart: number;
  middleware: Array<MiddlewareTiming>;
  prepass: Array<PrepassTiming>;
  prepassMarked: boolean;
  prepassStart: number;
  markPrepass(pendingSize?: number): void;
}

export type TimingPlugin = {
  from(ctx: any): TimingInterface;
};
