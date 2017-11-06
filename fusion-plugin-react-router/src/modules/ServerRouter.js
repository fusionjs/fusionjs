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
import {createPath, parsePath} from 'history';
import {Router} from 'react-router-dom';

const addLeadingSlash = path => (path.charAt(0) === '/' ? path : '/' + path);

/**
 * @param {string|object} location
 * @param {string} prefix
 * @returns {object}
 */
const addRoutePrefix = (location, prefix) => {
  if (!prefix) return location;
  if (typeof location === 'string') {
    return `${prefix}${addLeadingSlash(location)}`;
  } else {
    return {
      ...location,
      pathname: `${prefix}${addLeadingSlash(location.pathname)}`,
    };
  }
};

/**
 * @param {string|object} location
 * @param {string} prefix
 * @returns {object}
 */
const removeRoutePrefix = (location, prefix) => {
  if (!prefix) return location;
  const pathname = typeof location === 'string' ? location : location.pathname;
  const hasPrefix = (pathname + '/').indexOf(prefix + '/') === 0;
  const unprefixedPathname = pathname.slice(prefix.length);
  const relativePathname = hasPrefix ? unprefixedPathname : pathname;

  if (typeof location === 'string') {
    return relativePathname;
  } else {
    return {
      ...location,
      pathname: relativePathname,
    };
  }
};

/**
 * @param {string} path
 * @param {string} prefix
 * @returns {object}
 */
const createLocation = (path, prefix) => {
  const unprefixedPath = removeRoutePrefix(path, prefix);
  return parsePath(unprefixedPath);
};

/**
 * @param {string|object} location
 * @param {string} prefix
 * @returns {string}
 */
const createPrefixedURL = (location, prefix) => {
  if (typeof location === 'string') {
    return addRoutePrefix(location, prefix);
  } else {
    return createPath(addRoutePrefix(location, prefix));
  }
};

/**
 * @param {string|object} location
 * @param {string} prefix
 * @returns {string}
 */
const createURL = (location, prefix) => {
  if (typeof location === 'string') {
    return removeRoutePrefix(location, prefix);
  } else {
    return createPath(removeRoutePrefix(location, prefix));
  }
};

const staticHandler = methodName => () => {
  throw new Error(`You cannot ${methodName} with server side <Router>`);
};

const noop = () => {};

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
export class ServerRouter extends React.Component {
  getChildContext() {
    return {
      router: {
        staticContext: this.props.context || {},
      },
      pageData: this.props.pageData,
    };
  }

  /**
   * @param {string|object} location
   * @returns {string}
   */
  createHref(location) {
    return createPrefixedURL(location, this.props.basename);
  }

  /**
   * @param {string} path
   */
  handlePush(path) {
    const {basename, context} = this.props;
    context.action = 'PUSH';
    context.location = createLocation(path, basename);
    context.url = createURL(path, basename);
  }

  /**
   * @param {string} path
   */
  handleReplace(path) {
    const {basename, context} = this.props;
    context.action = 'REPLACE';
    context.location = createLocation(path, basename);
    context.url = createURL(path, basename);
  }

  handleListen() {
    return noop;
  }

  render() {
    /* eslint-disable no-unused-vars */
    const {context, location, ...props} = this.props;
    /* eslint-enable no-unused-vars */
    const history = {
      createHref: this.createHref.bind(this),
      action: 'POP',
      location: createLocation(location, this.props.basename),
      push: this.handlePush.bind(this),
      replace: this.handleReplace.bind(this),
      go: staticHandler('go'),
      back: staticHandler('back'),
      forward: staticHandler('forward'),
      listen: this.handleListen,
    };

    return <Router {...props} history={history} />;
  }
}

ServerRouter.defaultProps = {
  basename: '',
  location: '/',
  context: {},
};

ServerRouter.childContextTypes = {
  router: () => {},
  pageData: () => {},
};
