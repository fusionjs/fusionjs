/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPath, parsePath} from 'history';

import {addRoutePrefix, removeRoutePrefix} from './utils.js';
import type {RouterHistoryType, LocationType} from '../types.js';

const createLocation = (
  path: string | LocationType,
  prefix: string
): LocationType => {
  const unprefixed = removeRoutePrefix(path, prefix);
  if (typeof unprefixed === 'string') {
    return ((parsePath(unprefixed): any): LocationType);
  } else {
    return unprefixed;
  }
};

const createPrefixedURL = (
  location: string | LocationType,
  prefix: string
): string | LocationType => {
  const prefixed = addRoutePrefix(location, prefix);
  if (typeof prefixed === 'string') {
    return prefixed;
  } else {
    return createPath(prefixed);
  }
};

const createURL = (
  location: string | LocationType,
  prefix: string
): string | LocationType => {
  const unprefixed = removeRoutePrefix(location, prefix);
  if (typeof unprefixed === 'string') {
    return unprefixed;
  } else {
    return createPath(unprefixed);
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
): RouterHistoryType {
  function createHref(location: string | LocationType): string | LocationType {
    return createPrefixedURL(location, basename);
  }
  function push(path: string) {
    context.action = 'PUSH';
    context.location = createLocation(path, basename);
    const url = createURL(path, basename);
    if (typeof url === 'string') {
      context.url = url;
    }
  }

  function replace(path: string) {
    context.action = 'REPLACE';
    context.location = createLocation(path, basename);
    const url = createURL(path, basename);
    if (typeof url === 'string') {
      context.url = url;
    }
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
  return (history: any);
}
