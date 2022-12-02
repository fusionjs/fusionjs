/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import type {History} from 'history';

import type {ReactNode, ComponentType, ReactElement} from 'react';

/* Custom types */

export type RouterPropsType = {
  basename?: string;
  children?: React.ReactNode;
  context?: StaticContextType;
  history: TNavigator;
  onRoute?: Function;
};

export type RouterType = React.ComponentType<RouterPropsType>;

export type StaticContextType = {
  action?: string | null;
  location?: TLocation | null;
  status?: number | null;
  url?: string | null;
  setCode?: (a: number) => void;
  redirect?: (a: string) => void;
};

export type RouterContextType = {
  basename: string;
  history: TNavigator;
  router: {
    staticContext: StaticContextType;
  };
  onRoute: Function;
};

/* Types below adapted from react-router-dom_v6 TypeScript types */

export type TLocation = {
  pathname: string;
  search: string;
  hash: string;
};

export type TTo = string | TLocation;

export type TNavigation = 'POP' | 'PUSH' | 'REPLACE';

export type TNavigator = History;

export type TRouterProps = {
  basename?: string;
  children?: ReactNode;
  location: string | TLocation;
  navigationType?: TNavigation;
  navigator: TNavigator;
  static?: boolean;
};

export type TRouter = ComponentType<TRouterProps>;

export type TNavigate = ComponentType<{
  to: TTo;
  replace?: boolean;
  state?: any;
}>;

export type TRoute = ComponentType<{
  caseSensitive?: boolean;
  children?: ReactNode;
  element?: ReactNode | null;
  index?: boolean;
  path?: string;
  trackingId?: string;
}>;

export type TRoutes = ComponentType<{
  children?: ReactNode;
  location?: TTo;
}>;

export type TUseLocation = () => TLocation;

export type TRouteObject = {
  caseSensitive?: boolean;
  children?: Array<TRouteObject>;
  element?: ReactNode;
  index?: boolean;
  path?: string;
};

export type TCreateRoutesFromChildren = (
  children: ReactNode
) => Array<TRouteObject>;

export type TRouteMatch = {
  params: {
    [key: string]: string;
  };
  pathname: string;
  route: TRouteObject;
};

export type TMatchRoutes = (
  routes: Array<TRouteObject>,
  location: TTo,
  basename?: string
) => Array<TRouteMatch> | null;

export type TBrowserRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  window?: any;
}>;

export type TUnstableHistoryRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  history: TNavigator;
}>;

export type THashRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  window?: any;
}>;

export type TMemoryRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  initialEntries?: Array<TTo>;
  initialIndex?: number;
}>;

export type TLink = ComponentType<{
  reloadDocument?: boolean;
  replace?: boolean;
  state?: any;
  to: TTo;
}>;

export type TNavLink = ComponentType<{
  children?: ReactNode;
  caseSensitive?: boolean;
  className?: string | Function;
  end?: boolean;
  style?: any;
}>;

export type TOutlet = ComponentType<{
  context?: any;
}>;

export type TUseOutletContext = () => any;

export type TStaticRouter = ComponentType<{
  basename?: string;
  children?: ReactNode;
  location: TTo;
}>;

export type TGeneratePath = (path: string, params: any) => string;

export type TRenderMatches = (
  matches: Array<TRouteMatch> | null
) => ReactElement<any> | null;

export type TMatchPath = (pattern: any, pathname: string) => any;

export type TResolvePath = (to: TTo, fromPathname: string) => TLocation;

export type TUseHref = (to: TTo) => string;

export type TUseLinkClickHandler = (to: TTo, options?: any) => any;

export type TUseInRouterContext = () => boolean;
export type TUseNavigationType = () => TNavigation;
export type TUseMatch = (pattern: any) => any;
export type TUseNavigate = () => any;
export type TUseOutlet = () => ReactElement<any> | null;
export type TUseParams = () => any;
export type TUseResolvedPath = (to: TTo) => TLocation;

export type TUseRoutes = (
  routes: Array<TRouteObject>,
  location?: TTo
) => ReactElement<any> | null;

export type TUseSearchParams = (defaultInit?: any) => [any, any];
export type TCreateSearchParams = (init?: any) => any;

/* Types below adapted from history_v5 TypeScript types */

export type THistory = {
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
