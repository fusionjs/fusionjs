/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import plugin, {RouterProviderToken, RouterToken} from './plugin';
import * as server from './server';
import * as browser from './browser';

declare var __BROWSER__: Boolean;
const BrowserRouter = __BROWSER__
  ? browser.BrowserRouter
  : server.BrowserRouter;
const HashRouter = __BROWSER__ ? browser.HashRouter : server.HashRouter;
const Link = __BROWSER__ ? browser.Link : server.Link;
const matchPath = __BROWSER__ ? browser.matchPath : server.matchPath;
const MemoryRouter = __BROWSER__ ? browser.MemoryRouter : server.MemoryRouter;
const NavLink = __BROWSER__ ? browser.NavLink : server.NavLink;
const Prompt = __BROWSER__ ? browser.Prompt : server.Prompt;
const Route = __BROWSER__ ? browser.Route : server.Route;
const Router = __BROWSER__ ? browser.Router : server.Router;
const Switch = __BROWSER__ ? browser.Switch : server.Switch;
const withRouter = __BROWSER__ ? browser.withRouter : server.withRouter;

const NotFound = __BROWSER__ ? browser.NotFound : server.NotFound;
const Redirect = __BROWSER__ ? browser.Redirect : server.Redirect;
const Status = __BROWSER__ ? browser.Status : server.Status;

export default plugin;
export {
  BrowserRouter,
  HashRouter,
  Link,
  matchPath,
  MemoryRouter,
  NavLink,
  NotFound,
  Prompt,
  Redirect,
  Route,
  Router,
  Status,
  Switch,
  withRouter,
  RouterProviderToken,
  RouterToken,
};

export * from './types.js';
