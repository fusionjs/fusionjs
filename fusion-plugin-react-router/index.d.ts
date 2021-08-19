/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as react_router from 'react-router';
export {
  RouteComponentProps as ContextRouterType,
  match as MatchType,
} from 'react-router';
import * as React from 'react';
import {History, Location} from 'history';
export {Location as LocationType, History as RouterHistoryType} from 'history';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {Token, Context, FusionPlugin, RouteTagsToken} from 'fusion-core';
import {
  Router as Router$1,
  BrowserRouter as BrowserRouter$2,
  HashRouter as HashRouter$1,
  Link as Link$1,
  matchPath as matchPath$1,
  MemoryRouter as MemoryRouter$1,
  NavLink as NavLink$1,
  Prompt as Prompt$1,
  Switch as Switch$1,
  withRouter as withRouter$1,
  useHistory as useHistory$1,
  useRouteMatch as useRouteMatch$1,
  useLocation as useLocation$1,
  useParams as useParams$1,
} from 'react-router-dom';

declare type RouterPropsType = {
  context?: any;
  onRoute?: Function;
  history: History;
  Provider?: BaseRouterType;
  basename?: string;
  children?: React.ReactNode;
};
declare type RouterType = React.ComponentType<RouterPropsType>;
declare type LocationShapeType = {
  pathname?: string;
  search?: string;
  hash?: string;
  state?: any;
};
declare type StaticContextType = {
  action?: string | null;
  location?: Location | null;
  status?: number | null;
  url?: string | null;
};
declare type BaseRouterType = React.ComponentType<{
  history: History;
  children?: React.ReactNode;
}>;

declare type ProviderPropsType = {
  history: History;
  children?: React.ReactNode;
};
declare type HistoryWrapperType = {
  from: (ctx: Context) => {
    history: History;
  };
};
declare const GetStaticContextToken: Token<(ctx: Context) => StaticContextType>;
declare const RouterProviderToken: Token<
  React.ComponentType<ProviderPropsType>
>;
declare const RouterToken: Token<HistoryWrapperType>;
declare type PluginDepsType = {
  getStaticContext: typeof GetStaticContextToken.optional;
  emitter: typeof UniversalEventsToken.optional;
  Provider: typeof RouterProviderToken.optional;
  RouteTags: typeof RouteTagsToken;
};
declare const plugin: FusionPlugin<PluginDepsType, HistoryWrapperType>;

declare type StatusPropsType = {
  children: React.ReactNode;
  code?: string | number;
};
declare type StatusContextType = {
  router?: {
    staticContext: {
      status: number;
    };
  };
};
declare class Status$1 extends React.Component<StatusPropsType> {
  constructor(props: StatusPropsType, context: StatusContextType);
  render(): React.ReactNode;
  static contextTypes: {
    router: any;
  };
}

declare type PropsType = {
  to: string | LocationShapeType;
  push?: boolean;
  from?: string;
  exact?: boolean;
  strict?: boolean;
  code?: number | string;
  children?: React.ReactNode;
};
declare type ContextType$1 = {
  router?: {
    staticContext?: StaticContextType;
  };
};
declare class Redirect$1 extends React.Component<PropsType> {
  context: ContextType$1;
  static defaultProps: {
    push: boolean;
    code: number;
  };
  render(): JSX.Element;
  static contextTypes: {
    router: any;
  };
}

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
declare class ServerRouter extends React.Component<RouterPropsType> {
  static defaultProps: {
    basename: string;
    context: {};
    Provider: typeof Router$1;
    onRoute: () => void;
  };
  getRouterStaticContext(): any;
  getChildContext(): {
    router: {
      staticContext: any;
    };
    onRoute: (routeData: any) => any;
  };
  render(): JSX.Element;
  static childContextTypes: {
    router: () => void;
    onRoute: () => void;
  };
}

declare type ContextType = {
  __IS_PREPARE__: boolean;
};
declare class BrowserRouter$1 extends React.Component<RouterPropsType> {
  lastTitle: string | undefined | null;
  context: ContextType;
  static defaultProps: {
    onRoute: () => void;
    Provider: typeof Router$1;
  };
  constructor(props: RouterPropsType, context: ContextType);
  getChildContext(): {
    onRoute: (routeData: any) => void;
  };
  render(): JSX.Element;
  static propTypes: {
    children: any;
    onRoute: any;
    history: any;
    Provider: any;
    basename: any;
  };
  static contextTypes: {
    __IS_PREPARE__: any;
  };
  static childContextTypes: {
    onRoute: any;
  };
}

declare const BrowserRouter: typeof BrowserRouter$2;
declare const HashRouter: typeof HashRouter$1;
declare const Link: typeof Link$1;
declare const matchPath: typeof matchPath$1;
declare const MemoryRouter: typeof MemoryRouter$1;
declare const NavLink: typeof NavLink$1;
declare const Prompt: typeof Prompt$1;
declare const Route: React.FC<
  {
    trackingId?: any;
    component?: React.ComponentType<any>;
    render?: (routeProps: any) => React.ReactNode;
    children?: React.ReactNode | ((routeProps: any) => React.ReactNode);
  } & react_router.RouteProps<
    string,
    {
      [x: string]: string;
    }
  > &
    react_router.OmitNative<
      {},
      keyof react_router.RouteProps<
        string,
        {
          [x: string]: string;
        }
      >
    >
>;
declare const Router: typeof BrowserRouter$1 | typeof ServerRouter;
declare const Switch: typeof Switch$1;
declare const withRouter: typeof withRouter$1;
declare const NotFound: <
  TProps extends {
    children: React.ReactNode;
  }
>(
  props: TProps
) => JSX.Element;
declare const Redirect: typeof Redirect$1;
declare const Status: typeof Status$1;
declare const useHistory: typeof useHistory$1;
declare const useRouteMatch: typeof useRouteMatch$1;
declare const useLocation: typeof useLocation$1;
declare const useParams: typeof useParams$1;

export {
  BrowserRouter,
  GetStaticContextToken,
  HashRouter,
  Link,
  LocationShapeType,
  MemoryRouter,
  NavLink,
  NotFound,
  Prompt,
  Redirect,
  Route,
  Router,
  RouterPropsType,
  RouterProviderToken,
  RouterToken,
  RouterType,
  StaticContextType,
  Status,
  Switch,
  plugin as default,
  matchPath,
  useHistory,
  useLocation,
  useParams,
  useRouteMatch,
  withRouter,
};
