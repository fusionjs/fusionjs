/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import dispatched from './dispatched';
import prepare from './prepare';
import prepared from './prepared';
import split from './split';
import exclude from './traverse-exclude';
import middleware from './middleware'; //typed

const prepareTyped: (
  element: React.Element<any>
  // $FlowFixMe
) => Promise<React.ComponentType<any>> = prepare;

const preparedTyped: (
  sideEffect: (props: Object, context: Object) => Promise<any>,
  opts?: {
    defer?: boolean,
    boundary?: boolean,
    componentDidMount?: boolean,
    componentWillReceiveProps?: boolean,
    componentDidUpdate?: boolean,
    forceUpdate?: boolean,
    contextTypes?: Object,
  }
) => (
  Component: React.ComponentType<any>
) => React.ComponentType<any> = prepared;

const splitTyped: (opts: {
  load: () => Promise<any>,
  LoadingComponent: React.ComponentType<any>,
  ErrorComponent: React.ComponentType<any>,
}) => React.ComponentType<any> = split;

const excludeTyped: (
  Component: React.ComponentType<any>
) => React.ComponentType<any> = exclude;

export {
  dispatched,
  prepareTyped as prepare,
  preparedTyped as prepared,
  splitTyped as split,
  excludeTyped as exclude,
  middleware,
};
