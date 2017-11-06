// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import plugin from './plugin';
import * as server from './server';
import * as browser from './browser';

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
};
