/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  BrowserRouter as BrowserRouterUntyped,
  HashRouter as HashRouterUntyped,
  Link as LinkUntyped,
  MemoryRouter as MemoryRouterUntyped,
  NavLink as NavLinkUntyped,
  Prompt as PromptUntyped,
  Router as _Router,
  Switch as SwitchUntyped,
  matchPath as matchPathUntyped,
  withRouter as withRouterUntyped,
  useHistory as useHistoryUntyped,
  useParams as useParamsUntyped,
  useRouteMatch as useRouteMatchUntyped,
  useLocation as useLocationUntyped,
} from 'react-router-dom';

import {Status, NotFound} from './modules/Status';
import {Redirect} from './modules/Redirect';
import {ServerRouter as Router} from './modules/ServerRouter';
import {Route} from './modules/Route';

import type {
  BrowserRouterType,
  HashRouterType,
  LinkType,
  MemoryRouterType,
  NavLinkType,
  PromptType,
  SwitchType,
  matchPathType,
  withRouterType,
  RouterHistoryType,
  MatchType,
  LocationType,
  ParamsType,
} from './types.js';

/**
 * Cast each of these imports from react-router-dom to a copied-version of their
 * types.  This is necessary as the libdef defined types will not be accessible to
 * consumers of this package.
 */
const BrowserRouter: BrowserRouterType = BrowserRouterUntyped;
const HashRouter: HashRouterType = HashRouterUntyped;
const Link: LinkType = LinkUntyped;
const MemoryRouter: MemoryRouterType = MemoryRouterUntyped;
const NavLink: NavLinkType = NavLinkUntyped;
const Prompt: PromptType = PromptUntyped;
const Switch: SwitchType = SwitchUntyped;
const matchPath: matchPathType = matchPathUntyped;
const withRouter: withRouterType = withRouterUntyped;
const useHistory: () => RouterHistoryType = useHistoryUntyped;
const useRouteMatch: () => MatchType = useRouteMatchUntyped;
const useLocation: () => LocationType = useLocationUntyped;
const useParams: () => ParamsType = useParamsUntyped;

export {
  BrowserRouter,
  HashRouter,
  Link,
  MemoryRouter,
  NavLink,
  Prompt,
  _Router,
  Switch,
  matchPath,
  withRouter,
  Status,
  NotFound,
  Redirect,
  Router,
  Route,
  useHistory,
  useRouteMatch,
  useLocation,
  useParams,
};
