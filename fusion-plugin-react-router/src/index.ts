/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import plugin, {RouterToken, GetStaticContextToken} from './plugin';
import * as server from './server';
import * as browser from './browser';

export * from './types';

declare var __BROWSER__: boolean;

export default plugin;

export {RouterToken, GetStaticContextToken};

export const Status = __BROWSER__ ? browser.Status : server.Status;
export const NotFound = __BROWSER__ ? browser.NotFound : server.NotFound;
export const Navigate = __BROWSER__ ? browser.Navigate : server.Navigate;
export const Router = __BROWSER__ ? browser.Router : server.Router;
export const BrowserRouter = __BROWSER__
  ? browser.BrowserRouter
  : server.BrowserRouter;
export const UnstableHistoryRouter = __BROWSER__
  ? browser.UnstableHistoryRouter
  : server.UnstableHistoryRouter;
export const HashRouter = __BROWSER__ ? browser.HashRouter : server.HashRouter;
export const MemoryRouter = __BROWSER__
  ? browser.MemoryRouter
  : server.MemoryRouter;
export const Link = __BROWSER__ ? browser.Link : server.Link;
export const NavLink = __BROWSER__ ? browser.NavLink : server.NavLink;
export const Outlet = __BROWSER__ ? browser.Outlet : server.Outlet;
export const useOutletContext = __BROWSER__
  ? browser.useOutletContext
  : server.useOutletContext;
export const Routes = __BROWSER__ ? browser.Routes : server.Routes;
export const Route = __BROWSER__ ? browser.Route : server.Route;
export const createRoutesFromChildren = __BROWSER__
  ? browser.createRoutesFromChildren
  : server.createRoutesFromChildren;
export const generatePath = __BROWSER__
  ? browser.generatePath
  : server.generatePath;
export const matchRoutes = __BROWSER__
  ? browser.matchRoutes
  : server.matchRoutes;
export const renderMatches = __BROWSER__
  ? browser.renderMatches
  : server.renderMatches;
export const matchPath = __BROWSER__ ? browser.matchPath : server.matchPath;
export const resolvePath = __BROWSER__
  ? browser.resolvePath
  : server.resolvePath;
export const useHref = __BROWSER__ ? browser.useHref : server.useHref;
export const useLinkClickHandler = __BROWSER__
  ? browser.useLinkClickHandler
  : server.useLinkClickHandler;
export const useInRouterContext = __BROWSER__
  ? browser.useInRouterContext
  : server.useInRouterContext;
export const useLocation = __BROWSER__
  ? browser.useLocation
  : server.useLocation;
export const useNavigationType = __BROWSER__
  ? browser.useNavigationType
  : server.useNavigationType;
export const useMatch = __BROWSER__ ? browser.useMatch : server.useMatch;
export const useNavigate = __BROWSER__
  ? browser.useNavigate
  : server.useNavigate;
export const useOutlet = __BROWSER__ ? browser.useOutlet : server.useOutlet;
export const useParams = __BROWSER__ ? browser.useParams : server.useParams;
export const useResolvedPath = __BROWSER__
  ? browser.useResolvedPath
  : server.useResolvedPath;
export const useRoutes = __BROWSER__ ? browser.useRoutes : server.useRoutes;
export const useSearchParams = __BROWSER__
  ? browser.useSearchParams
  : server.useSearchParams;
export const createSearchParams = __BROWSER__
  ? browser.createSearchParams
  : server.createSearchParams;
