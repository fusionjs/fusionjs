/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPath, parsePath} from 'history';

import {addRoutePrefix} from './utils.js';
import type {TLocation, StaticContextType, TTo, TNavigator} from '../types.js';

const locationToCreatePathOpts = (loc: TLocation) => {
  const opts = {};
  for (const opt of ['pathname', 'search', 'hash']) {
    if (loc[opt]) opts[opt] = loc[opt];
  }
  return opts;
};

const defaultCreateLocation = (path: TTo) => {
  let location: TLocation = typeof path === 'string' ? parsePath(path) : path;
  location.pathname = decodeURI(location.pathname);
  if (!location.pathname) {
    location.pathname = '/';
  }
  return location;
};

const createLocation = (
  path: TTo,
  prefix: string,
  addPrefix: boolean
): TLocation => {
  const finalPath = addPrefix ? createPrefixedURL(path, prefix) : path;
  try {
    return defaultCreateLocation(finalPath);
  } catch (e) {
    if (e instanceof URIError) {
      return defaultCreateLocation(
        typeof finalPath === 'string'
          ? encodeURI(finalPath)
          : {
              ...finalPath,
              pathname: encodeURI(finalPath.pathname),
            }
      );
    } else {
      throw e;
    }
  }
};

const createPrefixedURL = (location: TTo, prefix: string): string => {
  const prefixed = addRoutePrefix(location, prefix);
  if (typeof prefixed === 'string') {
    return prefixed;
  } else {
    return createPath(locationToCreatePathOpts(prefixed));
  }
};

const staticHandler = (methodName) => () => {
  throw new Error(`You cannot ${methodName} with server side <Router>`);
};

const noop = () => {};

export function createServerHistory(
  basename: string,
  context: StaticContextType,
  location: string
): TNavigator {
  function createHref(location: TTo): string {
    return createPrefixedURL(location, basename);
  }
  function push(path: TTo) {
    context.action = 'PUSH';
    // Ensure prefix is always included
    context.location = createLocation(path, basename, true);
    const url = createPath(locationToCreatePathOpts(context.location));
    if (typeof url === 'string') {
      context.url = url;
    }
  }

  function replace(path: TTo) {
    context.action = 'REPLACE';
    // Ensure prefix is always included
    context.location = createLocation(path, basename, true);
    const url = createPath(locationToCreatePathOpts(context.location));
    if (typeof url === 'string') {
      context.url = url;
    }
  }
  const history = {
    action: 'POP',
    location: createLocation(location, basename, true),
    go: staticHandler('go'),
    push,
    replace,
    createHref,
    back: staticHandler('back'),
    forward: staticHandler('forward'),
    listen: () => noop,
    block: () => noop,
  };
  return (history: TNavigator);
}
