/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import {ReactNode, ComponentType, ReactElement} from 'react';
import {History} from 'history';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {Token, Context, FusionPlugin, RouteTagsToken} from 'fusion-core';

declare type RouterPropsType = {
  basename?: string;
  children?: React.ReactNode;
  context?: StaticContextType;
  history: TNavigator;
  onRoute?: Function;
};
declare type RouterType = React.ComponentType<RouterPropsType>;
declare type StaticContextType = {
  action?: string | null;
  location?: TLocation | null;
  status?: number | null;
  url?: string | null;
  setCode?: (a: number) => void;
  redirect?: (a: string) => void;
};
declare type RouterContextType = {
  basename: string;
  history: TNavigator;
  router: {
    staticContext: StaticContextType;
  };
  onRoute: Function;
};
declare type TLocation = {
  pathname: string;
  search: string;
  hash: string;
};
declare type TTo = string | TLocation;
declare type TNavigation = 'POP' | 'PUSH' | 'REPLACE';
declare type TNavigator = History;
declare type TRouterProps = {
  basename?: string;
  children?: ReactNode;
  location: string | TLocation;
  navigationType?: TNavigation;
  navigator: TNavigator;
  static?: boolean;
};
declare type TRouter = ComponentType<TRouterProps>;
declare type TNavigate = ComponentType<{
  to: TTo;
  replace?: boolean;
  state?: any;
}>;
declare type TRoute = ComponentType<{
  caseSensitive?: boolean;
  children?: ReactNode;
  element?: ReactNode | null;
  index?: boolean;
  path?: string;
  trackingId?: string;
}>;
declare type TRoutes = ComponentType<{
  children?: ReactNode;
  location?: TTo;
}>;
declare type TUseLocation = () => TLocation;
declare type TRouteObject = {
  caseSensitive?: boolean;
  children?: Array<TRouteObject>;
  element?: ReactNode;
  index?: boolean;
  path?: string;
};
declare type TCreateRoutesFromChildren = (
  children: ReactNode
) => Array<TRouteObject>;
declare type TRouteMatch = {
  params: {
    [key: string]: string;
  };
  pathname: string;
  route: TRouteObject;
};
declare type TMatchRoutes = (
  routes: Array<TRouteObject>,
  location: TTo,
  basename?: string
) => Array<TRouteMatch> | null;
declare type TBrowserRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  window?: any;
}>;
declare type TUnstableHistoryRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  history: TNavigator;
}>;
declare type THashRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  window?: any;
}>;
declare type TMemoryRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  initialEntries?: Array<TTo>;
  initialIndex?: number;
}>;
declare type TLink = ComponentType<{
  reloadDocument?: boolean;
  replace?: boolean;
  state?: any;
  to: TTo;
}>;
declare type TNavLink = ComponentType<{
  children?: ReactNode;
  caseSensitive?: boolean;
  className?: string | Function;
  end?: boolean;
  style?: any;
}>;
declare type TOutlet = ComponentType<{
  context?: any;
}>;
declare type TUseOutletContext = () => any;
declare type TStaticRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  location: TTo;
}>;
declare type TGeneratePath = (path: string, params: any) => string;
declare type TRenderMatches = (
  matches: Array<TRouteMatch> | null
) => ReactElement<any> | null;
declare type TMatchPath = (pattern: any, pathname: string) => any;
declare type TResolvePath = (to: TTo, fromPathname: string) => TLocation;
declare type TUseHref = (to: TTo) => string;
declare type TUseLinkClickHandler = (to: TTo, options?: any) => any;
declare type TUseInRouterContext = () => boolean;
declare type TUseNavigationType = () => TNavigation;
declare type TUseMatch = (pattern: any) => any;
declare type TUseNavigate = () => any;
declare type TUseOutlet = () => ReactElement<any> | null;
declare type TUseParams = () => any;
declare type TUseResolvedPath = (to: TTo) => TLocation;
declare type TUseRoutes = (
  routes: Array<TRouteObject>,
  location?: TTo
) => ReactElement<any> | null;
declare type TUseSearchParams = (defaultInit?: any) => [any, any];
declare type TCreateSearchParams = (init?: any) => any;
declare type THistory = {
  action: string;
  location: TLocation;
  go(delta: number): void;
  push(to: TTo, state?: any): void;
  replace(path: TTo, state?: any): void;
  createHref(to: TTo): string;
  back(): void;
  forward(): void;
  listen(listener: any): () => void;
  block(blocker: any): () => void;
};

declare type HistoryWrapperType = {
  from: (ctx: Context) => {
    history: TNavigator;
  };
};
declare const GetStaticContextToken: Token<(ctx: Context) => StaticContextType>;
declare const RouterToken: Token<HistoryWrapperType>;
declare type PluginDepsType = {
  getStaticContext: typeof GetStaticContextToken.optional;
  emitter: typeof UniversalEventsToken.optional;
  RouteTags: typeof RouteTagsToken;
};
declare const plugin: FusionPlugin<PluginDepsType, HistoryWrapperType>;

declare type StatusPropsType = {
  children: React.ReactNode;
  code?: string | number;
};
declare class Status$1 extends React.Component<StatusPropsType> {
  constructor(props: StatusPropsType, context: RouterContextType);
  render(): React.ReactNode;
  static contextTypes: {
    router: any;
  };
}

declare type PropsType$1 = {
  to: TTo;
  replace?: boolean;
  code?: number | string;
};
declare class Navigate$1 extends React.Component<PropsType$1> {
  static defaultProps: {
    to: string;
    replace: boolean;
    code: number;
  };
  render(): JSX.Element;
  static contextTypes: {
    history: any;
    router: any;
  };
}

declare type PropsType = {
  children?: React.ReactNode;
};
declare function Routes$1(
  props: PropsType,
  context: RouterContextType
): JSX.Element;
declare namespace Routes$1 {
  var contextTypes: {
    history: any;
    router: any;
    onRoute: any;
  };
  var displayName: string;
}

declare const Status: typeof Status$1;
declare const NotFound: <
  TProps extends {
    children: React.ReactNode;
  }
>(
  props: TProps
) => JSX.Element;
declare const Navigate: typeof Navigate$1;
declare const Router: RouterType;
declare const BrowserRouter: TBrowserRouter;
declare const UnstableHistoryRouter: TUnstableHistoryRouter;
declare const HashRouter: THashRouter;
declare const MemoryRouter: TMemoryRouter;
declare const Link: TLink;
declare const NavLink: TNavLink;
declare const Outlet: TOutlet;
declare const useOutletContext: TUseOutletContext;
declare const Routes: typeof Routes$1;
declare const Route: TRoute;
declare const createRoutesFromChildren: TCreateRoutesFromChildren;
declare const generatePath: TGeneratePath;
declare const matchRoutes: TMatchRoutes;
declare const renderMatches: TRenderMatches;
declare const matchPath: TMatchPath;
declare const resolvePath: TResolvePath;
declare const useHref: TUseHref;
declare const useLinkClickHandler: TUseLinkClickHandler;
declare const useInRouterContext: TUseInRouterContext;
declare const useLocation: TUseLocation;
declare const useNavigationType: TUseNavigationType;
declare const useMatch: TUseMatch;
declare const useNavigate: TUseNavigate;
declare const useOutlet: TUseOutlet;
declare const useParams: TUseParams;
declare const useResolvedPath: TUseResolvedPath;
declare const useRoutes: TUseRoutes;
declare const useSearchParams: TUseSearchParams;
declare const createSearchParams: TCreateSearchParams;

export {
  BrowserRouter,
  GetStaticContextToken,
  HashRouter,
  Link,
  MemoryRouter,
  NavLink,
  Navigate,
  NotFound,
  Outlet,
  Route,
  Router,
  RouterContextType,
  RouterPropsType,
  RouterToken,
  RouterType,
  Routes,
  StaticContextType,
  Status,
  TBrowserRouter,
  TCreateRoutesFromChildren,
  TCreateSearchParams,
  TGeneratePath,
  THashRouter,
  THistory,
  TLink,
  TLocation,
  TMatchPath,
  TMatchRoutes,
  TMemoryRouter,
  TNavLink,
  TNavigate,
  TNavigation,
  TNavigator,
  TOutlet,
  TRenderMatches,
  TResolvePath,
  TRoute,
  TRouteMatch,
  TRouteObject,
  TRouter,
  TRouterProps,
  TRoutes,
  TStaticRouter,
  TTo,
  TUnstableHistoryRouter,
  TUseHref,
  TUseInRouterContext,
  TUseLinkClickHandler,
  TUseLocation,
  TUseMatch,
  TUseNavigate,
  TUseNavigationType,
  TUseOutlet,
  TUseOutletContext,
  TUseParams,
  TUseResolvedPath,
  TUseRoutes,
  TUseSearchParams,
  UnstableHistoryRouter,
  createRoutesFromChildren,
  createSearchParams,
  plugin as default,
  generatePath,
  matchPath,
  matchRoutes,
  renderMatches,
  resolvePath,
  useHref,
  useInRouterContext,
  useLinkClickHandler,
  useLocation,
  useMatch,
  useNavigate,
  useNavigationType,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useRoutes,
  useSearchParams,
};
