/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  BrowserRouter as BrowserRouterUntyped,
  unstable_HistoryRouter as UnstableHistoryRouterUntyped,
  HashRouter as HashRouterUntyped,
  MemoryRouter as MemoryRouterUntyped,
  Link as LinkUntyped,
  NavLink as NavLinkUntyped,
  Router as _Router,
  Outlet as OutletUntyped,
  useOutletContext as useOutletContextUntyped,
  Routes as _Routes,
  Route as RouteUntyped,
  // @ts-expect-error todo(flow->ts)
  StaticRouter as StaticRouterUntyped,
  createRoutesFromChildren as createRoutesFromChildrenUntyped,
  generatePath as generatePathUntyped,
  matchRoutes as matchRoutesUntyped,
  renderMatches as renderMatchesUntyped,
  matchPath as matchPathUntyped,
  resolvePath as resolvePathUntyped,
  useHref as useHrefUntyped,
  useLinkClickHandler as useLinkClickHandlerUntyped,
  useInRouterContext as useInRouterContextUntyped,
  useLocation as useLocationUntyped,
  useNavigationType as useNavigationTypeUntyped,
  useMatch as useMatchUntyped,
  useNavigate as useNavigateUntyped,
  useOutlet as useOutletUntyped,
  useParams as useParamsUntyped,
  useResolvedPath as useResolvedPathUntyped,
  useRoutes as useRoutesUntyped,
  useSearchParams as useSearchParamsUntyped,
  createSearchParams as createSearchParamsUntyped,
} from 'react-router-dom';

import {Status, NotFound} from './modules/Status';
import {Navigate} from './modules/Navigate';
import {ServerRouter as Router} from './modules/ServerRouter';
import {Routes} from './modules/Routes';

import type {
  TRoute,
  TUseLocation,
  TCreateRoutesFromChildren,
  TMatchRoutes,
  TBrowserRouter,
  TUnstableHistoryRouter,
  THashRouter,
  TMemoryRouter,
  TLink,
  TNavLink,
  TOutlet,
  TUseOutletContext,
  TStaticRouter,
  TGeneratePath,
  TRenderMatches,
  TMatchPath,
  TResolvePath,
  TUseHref,
  TUseLinkClickHandler,
  TUseInRouterContext,
  TUseNavigationType,
  TUseMatch,
  TUseNavigate,
  TUseOutlet,
  TUseParams,
  TUseResolvedPath,
  TUseRoutes,
  TUseSearchParams,
  TCreateSearchParams,
} from './types';

/**
 * Cast each of these imports from react-router-dom to a copied-version of their
 * types. This is necessary as the libdef defined types will not be accessible to
 * consumers of this package.
 */
const BrowserRouter: TBrowserRouter = BrowserRouterUntyped;
const UnstableHistoryRouter: TUnstableHistoryRouter =
  UnstableHistoryRouterUntyped;
const HashRouter: THashRouter = HashRouterUntyped;
const MemoryRouter: TMemoryRouter = MemoryRouterUntyped;
// @ts-expect-error todo(flow->ts)
const Link: TLink = LinkUntyped;
// @ts-expect-error todo(flow->ts)
const NavLink: TNavLink = NavLinkUntyped;
const Outlet: TOutlet = OutletUntyped;
const useOutletContext: TUseOutletContext = useOutletContextUntyped;
// $FlowFixMe - Adding custom property
const Route: TRoute = RouteUntyped;
const StaticRouter: TStaticRouter = StaticRouterUntyped;
const createRoutesFromChildren: TCreateRoutesFromChildren =
  createRoutesFromChildrenUntyped;
const generatePath: TGeneratePath = generatePathUntyped;
const matchRoutes: TMatchRoutes = matchRoutesUntyped;
const renderMatches: TRenderMatches = renderMatchesUntyped;
const matchPath: TMatchPath = matchPathUntyped;
const resolvePath: TResolvePath = resolvePathUntyped;
const useHref: TUseHref = useHrefUntyped;
const useLinkClickHandler: TUseLinkClickHandler = useLinkClickHandlerUntyped;
const useInRouterContext: TUseInRouterContext = useInRouterContextUntyped;
const useLocation: TUseLocation = useLocationUntyped;
const useNavigationType: TUseNavigationType = useNavigationTypeUntyped;
const useMatch: TUseMatch = useMatchUntyped;
const useNavigate: TUseNavigate = useNavigateUntyped;
const useOutlet: TUseOutlet = useOutletUntyped;
const useParams: TUseParams = useParamsUntyped;
const useResolvedPath: TUseResolvedPath = useResolvedPathUntyped;
const useRoutes: TUseRoutes = useRoutesUntyped;
// @ts-expect-error todo(flow->ts)
const useSearchParams: TUseSearchParams = useSearchParamsUntyped;
const createSearchParams: TCreateSearchParams = createSearchParamsUntyped;

export {
  // Custom
  Status,
  NotFound,
  Navigate,
  Router,
  Routes,
  // Passed Through
  BrowserRouter,
  UnstableHistoryRouter,
  HashRouter,
  MemoryRouter,
  Link,
  NavLink,
  _Router,
  Outlet,
  useOutletContext,
  _Routes,
  Route,
  StaticRouter,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  renderMatches,
  matchPath,
  resolvePath,
  useHref,
  useLinkClickHandler,
  useInRouterContext,
  useLocation,
  useNavigationType,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedPath,
  useRoutes,
  useSearchParams,
  createSearchParams,
};
