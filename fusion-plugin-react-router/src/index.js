/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import plugin, {
  RouterProviderToken,
  RouterToken,
  GetStaticContextToken,
} from './plugin';
import * as server from './server';
import * as browser from './browser';

export type * from './types.js';

declare var __BROWSER__: Boolean;

export default plugin;

export {RouterProviderToken, RouterToken, GetStaticContextToken};

export const BrowserRouter = __BROWSER__
  ? browser.BrowserRouter
  : server.BrowserRouter;
export const HashRouter = __BROWSER__ ? browser.HashRouter : server.HashRouter;
export const Link = __BROWSER__ ? browser.Link : server.Link;
export const matchPath = __BROWSER__ ? browser.matchPath : server.matchPath;
export const MemoryRouter = __BROWSER__
  ? browser.MemoryRouter
  : server.MemoryRouter;
export const NavLink = __BROWSER__ ? browser.NavLink : server.NavLink;
export const Prompt = __BROWSER__ ? browser.Prompt : server.Prompt;
export const Route = __BROWSER__ ? browser.Route : server.Route;
export const Router = __BROWSER__ ? browser.Router : server.Router;
export const Switch = __BROWSER__ ? browser.Switch : server.Switch;
export const withRouter = __BROWSER__ ? browser.withRouter : server.withRouter;
export const NotFound = __BROWSER__ ? browser.NotFound : server.NotFound;
export const Redirect = __BROWSER__ ? browser.Redirect : server.Redirect;
export const Status = __BROWSER__ ? browser.Status : server.Status;
export const useHistory = __BROWSER__ ? browser.useHistory : server.useHistory;
export const useRouteMatch = __BROWSER__
  ? browser.useRouteMatch
  : server.useRouteMatch;
export const useLocation = __BROWSER__
  ? browser.useLocation
  : server.useLocation;
export const useParams = __BROWSER__ ? browser.useParams : server.useParams;
