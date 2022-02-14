/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import fusion_core__default, {
  FusionPlugin,
  FusionPluginDepsType,
  Token,
  Middleware,
  Context,
} from 'fusion-core';
import * as React from 'react';
import {ReactElement} from 'react';

declare type FusionPluginNoHidden<
  TDeps extends FusionPluginDepsType,
  TService
> = Omit<FusionPlugin<TDeps, TService>, '__plugin__' | 'stack'>;
declare const _default$3: {
  create: <
    TDeps extends Readonly<{
      [key: string]: fusion_core.Token<any>;
    }>,
    TService extends unknown
  >(
    name: string,
    plugin:
      | FusionPlugin<TDeps, TService>
      | (FusionPluginNoHidden<TDeps, TService> & {
          __plugin__?: void;
        }),
    provider?: React.ComponentType<any>
  ) => FusionPlugin<TDeps, TService>;
};

declare type ReactHOC = (
  a: React.ComponentType<any>
) => React.ComponentType<any>;
declare const _default$2: {
  create: (
    name: string,
    mapProvidesToProps?: (a: any) => any,
    token?: Token<any>
  ) => ReactHOC;
};

declare const _default$1: {
  create: (name: string) => React.ComponentType<any>;
};

declare const FusionContext: React.Context<any>;
declare const ServiceContext: React.Context<any>;
declare type ReturnsType<T> = () => T;
declare function useService<TService>(token: ReturnsType<TService>): TService;
declare type ServiceConsumerProps<TService> = {
  token: ReturnsType<TService>;
  children: (a: TService) => ReactElement<any>;
};
declare function ServiceConsumer<TService>({
  token,
  children,
}: ServiceConsumerProps<TService>): JSX.Element;
declare type Dependencies = {
  [x: string]: ReturnsType<unknown>;
};
declare type Services = {
  [x: string]: ReturnsType<unknown>;
};
declare type Props = {
  [x: string]: any;
};
declare type Mapper = (a: Services) => Props;
declare function withServices(
  deps: Dependencies,
  mapServicesToProps?: Mapper
): (Component: React.ComponentType<any>) => (props?: Props) => JSX.Element;

declare function prepare(element: any, ctx: any): Promise<any>;

declare type PreparedOpts = {
  boundary?: boolean;
  defer?: boolean;
  componentDidMount?: boolean;
  componentWillReceiveProps?: boolean;
  componentDidUpdate?: boolean;
  contextTypes?: any;
  forceUpdate?: boolean;
};
declare const prepared: (
  sideEffect: (b: any, a: any) => any | Promise<any>,
  opts?: PreparedOpts
) => <Config extends unknown>(
  OriginalComponent: React.ComponentType<Config>
) => React.ComponentType<
  {
    effectId?: string;
  } & Config
>;

declare global {
  interface Window {
    webpackChunkFusion: any;
  }
}
declare function withAsyncComponent<Config>({
  defer,
  load,
  LoadingComponent,
  ErrorComponent,
}: {
  defer?: boolean;
  load: () => Promise<{
    default: React.ComponentType<Config>;
  }>;
  LoadingComponent: React.ComponentType<any>;
  ErrorComponent: React.ComponentType<any>;
}): React.ComponentType<Config>;

declare const _default: <Config extends unknown>(
  OriginalComponent: React.ComponentType<Config>
) => React.ComponentType<
  {
    effectId?: string;
  } & Config
>;

declare const middleware: Middleware;

declare const SkipPrepareToken: fusion_core.Token<boolean>;
declare type Render = (el: React.ReactElement<any>, context: Context) => any;
declare class App extends fusion_core__default {
  constructor(root: React.ReactElement<any>, render?: Render | null);
}

export {
  FusionContext,
  _default$2 as ProvidedHOC,
  _default$1 as Provider,
  _default$3 as ProviderPlugin,
  Render,
  ServiceConsumer,
  ServiceContext,
  SkipPrepareToken,
  App as default,
  _default as exclude,
  middleware,
  prepare,
  prepared,
  withAsyncComponent as split,
  useService,
  withServices,
};
