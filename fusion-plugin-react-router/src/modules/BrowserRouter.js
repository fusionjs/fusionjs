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

import React from 'react';
import PropTypes from 'prop-types';
export {
  HashRouter,
  Link,
  MemoryRouter,
  NavLink,
  Prompt,
  StaticRouter,
  Switch,
  matchPath,
  withRouter,
} from 'react-router-dom';
export {Status, NotFound} from './Status';
export {Redirect} from './Redirect';

import {Router as BaseRouter} from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';

class BrowserRouter extends React.Component {
  constructor(props = {}) {
    super(props);
    this.history = createHistory(this.props);
    this.currentPath = this.history.location.pathname;
    this.lastPath = null;
    this.pageData = {};
  }

  getChildContext() {
    return {
      pageData: this.pageData,
    };
  }

  componentDidMount() {
    this.onRoute();
  }

  componentWillMount() {
    this.unlisten = this.history.listen(() => {
      this.lastPath = this.currentPath;
      this.currentPath = this.history.location.pathname;
    });
  }

  componentDidUpdate() {
    this.onRoute();
  }

  componentWillUnmount() {
    this.unlisten();
  }

  onRoute() {
    if (this.currentPath !== this.lastPath) {
      this.lastPath = this.currentPath;
      const {title, page} = this.pageData;
      this.props.onRoute({title, page});
    }
  }

  render() {
    return (
      <BaseRouter history={this.history}>{this.props.children}</BaseRouter>
    );
  }
}

BrowserRouter.propTypes = {
  basename: PropTypes.string,
  forceRefresh: PropTypes.bool,
  getUserConfirmation: PropTypes.func,
  keyLength: PropTypes.number,
  children: PropTypes.node,
  onRoute: PropTypes.func,
};

BrowserRouter.childContextTypes = {
  pageData: PropTypes.object,
};

BrowserRouter.defaultProps = {
  onRoute: () => {},
};

export {BrowserRouter};
