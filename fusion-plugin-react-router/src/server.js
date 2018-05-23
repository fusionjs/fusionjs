/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  BrowserRouter,
  HashRouter,
  Link,
  MemoryRouter,
  NavLink,
  Prompt,
  Router as _Router,
  Switch,
  matchPath,
  withRouter,
} from 'react-router-dom';

import {Status, NotFound} from './modules/Status';
import {Redirect} from './modules/Redirect';
import {ServerRouter as Router} from './modules/ServerRouter';
import {Route} from './modules/Route';

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
};
