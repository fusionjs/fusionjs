/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {
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
export {Status, NotFound} from './modules/Status';
export {Redirect} from './modules/Redirect';
export {ServerRouter as Router} from './modules/ServerRouter';
export {Route} from './modules/Route';
