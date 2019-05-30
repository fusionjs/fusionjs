/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

export type LocationType = {
  pathname: string,
  search: string,
  hash: string,
  state?: any,
  key?: string,
};

export type LocationShapeType = {
  pathname?: string,
  search?: string,
  hash?: string,
  state?: any,
};

/* Types below adapted from flow-typed's libdef for react-router-dom
 * (https://github.com/flow-typed/flow-typed/blob/master/definitions/npm/react-router-dom_v4.x.x/flow_v0.63.x-/react-router-dom_v4.x.x.js)
 */
export type BrowserRouterType = React.ComponentType<{|
  basename?: string,
  forceRefresh?: boolean,
  getUserConfirmation?: GetUserConfirmation,
  keyLength?: number,
  children?: React.Node,
|}>;

export type HashRouterType = React.ComponentType<{|
  basename?: string,
  getUserConfirmation?: GetUserConfirmation,
  hashType?: 'slash' | 'noslash' | 'hashbang',
  children?: React.Node,
|}>;

export type LinkType = React.ComponentType<{
  className?: string,
  to: string | LocationShapeType,
  replace?: boolean,
  children?: React.Node,
}>;

export type NavLinkType = React.ComponentType<{
  to: string | LocationShapeType,
  activeClassName?: string,
  className?: string,
  activeStyle?: Object,
  style?: Object,
  isActive?: (match: MatchType, location: LocationType) => boolean,
  children?: React.Node,
  exact?: boolean,
  strict?: boolean,
}>;

// NOTE: Below are mostly duplicated from react-router.
export type HistoryActionType = 'PUSH' | 'REPLACE' | 'POP';

export type RouterHistoryType = {
  length: number,
  location: LocationType,
  action: HistoryActionType,
  listen(
    callback: (location: LocationType, action: HistoryActionType) => void
  ): () => void,
  push(path: string | LocationShapeType, state?: any): void,
  replace(path: string | LocationShapeType, state?: any): void,
  go(n: number): void,
  goBack(): void,
  goForward(): void,
  canGo?: (n: number) => boolean,
  block(
      callback: | string // eslint-disable-line
      | ((location: LocationType, action: HistoryActionType) => ?string)
  ): () => void,
  // createMemoryHistory
  index?: number,
  entries?: Array<LocationType>,
};

export type MatchType = {
  params: {[key: string]: ?string},
  isExact: boolean,
  path: string,
  url: string,
};

export type ContextRouterType = {|
  history: RouterHistoryType,
  location: LocationType,
  match: MatchType,
  staticContext?: StaticRouterContextType,
|};

type ContextRouterVoid = {
  history: RouterHistoryType | void,
  location: LocationType | void,
  match: MatchType | void,
  staticContext?: StaticRouterContextType | void,
};

type GetUserConfirmation = (
  message: string,
  callback: (confirmed: boolean) => void
) => void;

export type StaticRouterContextType = {
  url?: string,
};

export type StaticRouterType = React.ComponentType<{|
  basename?: string,
  location?: string | LocationType,
  context: StaticRouterContextType,
  children?: React.Node,
|}>;

export type MemoryRouterType = React.ComponentType<{|
  initialEntries?: Array<LocationShapeType | string>,
  initialIndex?: number,
  getUserConfirmation?: GetUserConfirmation,
  keyLength?: number,
  children?: React.Node,
|}>;

export type RouterType = React.ComponentType<{
  history: RouterHistoryType,
  basename?: string,
  children?: React.Node,
}>;

export type PromptType = React.ComponentType<{|
  message: string | ((location: LocationType) => string | boolean),
  when?: boolean,
|}>;

export type RedirectType = React.ComponentType<{|
  to: string | LocationShapeType,
  push?: boolean,
  from?: string,
  exact?: boolean,
  strict?: boolean,
  code?: number | string,
  children?: React.Node,
|}>;

export type RouteType = React.ComponentType<{|
  component?: React.ComponentType<*>,
  render?: (router: ContextRouterType) => React.Node,
  children?: React.ComponentType<ContextRouterType> | React.Node,
  path?: string | Array<string>,
  exact?: boolean,
  strict?: boolean,
  location?: LocationShapeType,
  sensitive?: boolean,
|}>;

export type SwitchType = React.ComponentType<{|
  children?: React.Node,
  location?: LocationType,
|}>;

export type withRouterType = <Props: {}, Component: React.ComponentType<Props>>(
  WrappedComponent: Component
) => React.ComponentType<
  $Diff<React.ElementConfig<Component>, ContextRouterVoid>
>;

type MatchPathOptions = {
  path?: string,
  exact?: boolean,
  sensitive?: boolean,
  strict?: boolean,
};

export type matchPathType = (
  pathname: string,
  options?: MatchPathOptions | string,
  parent?: MatchType
) => null | MatchType;

export type generatePathType = (pattern?: string, params?: Object) => string;
