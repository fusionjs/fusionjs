/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

/* Custom types */

export type RouterPropsType = {
  basename?: string,
  children?: React.Node,
  context?: StaticContextType,
  history: TNavigator,
  onRoute?: Function,
};

export type RouterType = React.ComponentType<RouterPropsType>;

export type StaticContextType = {
  action?: ?string,
  location?: ?TLocation,
  status?: ?number,
  url?: ?string,
  setCode?: (number) => void,
  redirect?: (string) => void,
};

export type RouterContextType = {
  basename: string,
  history: TNavigator,
  router: {
    staticContext: StaticContextType,
  },
  onRoute: Function,
};

/* Types below adapted from react-router-dom_v6 TypeScript types */

export type TLocation = {|
  pathname: string,
  search: string,
  hash: string,
|};

export type TTo = string | TLocation;

export type TNavigation = 'POP' | 'PUSH' | 'REPLACE';

export type TNavigator = {|
  action: string,
  location: TLocation,
  go(delta: number): void,
  push(to: TTo, state?: any): void,
  replace(path: TTo, state?: any): void,
  createHref(to: TTo): string,
  back(): void,
  forward(): void,
  listen(listener: any): () => void,
  block(blocker: any): () => void,
|};

export type TRouterProps = {|
  basename?: string,
  children?: React$Node,
  location: string | TLocation,
  navigationType?: TNavigation,
  navigator: TNavigator,
  static?: boolean,
|};

export type TRouter = React$ComponentType<TRouterProps>;

export type TNavigate = React$ComponentType<{|
  to: TTo,
  replace?: boolean,
  state?: any,
|}>;

export type TRoute = React$ComponentType<{|
  caseSensitive?: boolean,
  children?: React$Node,
  element?: React$Node | null,
  index?: boolean,
  path?: string,
  trackingId?: string,
|}>;

export type TRoutes = React$ComponentType<{|
  children?: React$Node,
  location?: TTo,
|}>;

export type TUseLocation = () => TLocation;

export type TRouteObject = {|
  caseSensitive?: boolean,
  children?: Array<TRouteObject>,
  element?: React$Node,
  index?: boolean,
  path?: string,
|};

export type TCreateRoutesFromChildren = (
  children: React$Node
) => Array<TRouteObject>;

export type TRouteMatch = {|
  params: {[key: string]: string},
  pathname: string,
  route: TRouteObject,
|};

export type TMatchRoutes = (
  routes: Array<TRouteObject>,
  location: TTo,
  basename?: string
) => Array<TRouteMatch> | null;

export type TBrowserRouter = React$ComponentType<{|
  basename?: string,
  children?: React$Node,
  window?: any,
|}>;

export type TUnstableHistoryRouter = React$ComponentType<{|
  basename?: string,
  children?: React$Node,
  history: TNavigator,
|}>;

export type THashRouter = React$ComponentType<{|
  basename?: string,
  children?: React$Node,
  window?: any,
|}>;

export type TMemoryRouter = React$ComponentType<{|
  basename?: string,
  children?: React$Node,
  initialEntries?: Array<TTo>,
  initialIndex?: number,
|}>;

export type TLink = React$ComponentType<{|
  reloadDocument?: boolean,
  replace?: boolean,
  state?: any,
  to: TTo,
|}>;

export type TNavLink = React$ComponentType<{|
  children?: React$Node,
  caseSensitive?: boolean,
  className?: string | Function,
  end?: boolean,
  style?: any,
|}>;

export type TOutlet = React$ComponentType<{|
  context?: any,
|}>;

export type TUseOutletContext = () => any;

export type TStaticRouter = React$ComponentType<{|
  basename?: string,
  children?: React$Node,
  location: TTo,
|}>;

export type TGeneratePath = (path: string, params: Object) => string;

export type TRenderMatches = (
  matches: Array<TRouteMatch> | null
) => React$Element<any> | null;

export type TMatchPath = (pattern: any, pathname: string) => any;

export type TResolvePath = (to: TTo, fromPathname: string) => TLocation;

export type TUseHref = (to: TTo) => string;

export type TUseLinkClickHandler = (to: TTo, options?: Object) => any;

export type TUseInRouterContext = () => boolean;
export type TUseNavigationType = () => TNavigation;
export type TUseMatch = (pattern: any) => any;
export type TUseNavigate = () => any;
export type TUseOutlet = () => React$Element<any> | null;
export type TUseParams = () => any;
export type TUseResolvedPath = (to: TTo) => TLocation;

export type TUseRoutes = (
  routes: Array<TRouteObject>,
  location?: TTo
) => React$Element<any> | null;

export type TUseSearchParams = (defaultInit?: any) => [any, any];
export type TCreateSearchParams = (init?: any) => any;

/* Types below adapted from history_v5 TypeScript types */

export type THistory = {|
  action: string,
  location: TLocation,
  go(delta: number): void,
  push(to: TTo, state?: any): void,
  replace(path: TTo, state?: any): void,
  createHref(to: TTo): string,
  back(): void,
  forward(): void,
  listen(listener: any): () => void,
  block(blocker: any): () => void,
|};
