/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {createPath, parsePath} from 'history';
import type {HistoryType, LocationType} from '../types';

const addLeadingSlash = path => (path.charAt(0) === '/' ? path : '/' + path);

const addRoutePrefix = (
  location: string | LocationType,
  prefix: string
): string | LocationType => {
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

const removeRoutePrefix = (
  location: string | LocationType,
  prefix: string
): string | LocationType => {
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

const createLocation = (
  path: string | LocationType,
  prefix: string
): LocationType => {
  const unprefixedPath = removeRoutePrefix(path, prefix);
  return parsePath(unprefixedPath);
};

const createPrefixedURL = (
  location: string | LocationType,
  prefix: string
): string | LocationType => {
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

type ContextType = {
  action: ?string,
  location: any,
  url: ?string,
};

export function createServerHistory(
  basename: string,
  context: ContextType,
  location: string | LocationType
): HistoryType {
  function createHref(location: string | LocationType): string | LocationType {
    return createPrefixedURL(location, basename);
  }
  function push(path: string) {
    context.action = 'PUSH';
    context.location = createLocation(path, basename);
    // $FlowFixMe
    context.url = createURL(path, basename);
  }

  function replace(path: string) {
    context.action = 'REPLACE';
    context.location = createLocation(path, basename);
    // $FlowFixMe
    context.url = createURL(path, basename);
  }
  const history = {
    length: 0,
    createHref,
    action: 'POP',
    location: createLocation(location, basename),
    push,
    replace,
    go: staticHandler('go'),
    goBack: staticHandler('back'),
    goForward: staticHandler('forward'),
    listen: () => noop,
  };
  return history;
}
