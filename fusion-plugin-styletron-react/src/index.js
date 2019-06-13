/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  styled,
  withStyle,
  withStyleDeep,
  withTransform,
  withWrapper,
} from 'styletron-react';

import {AtomicPrefixToken} from './constants.js';

import server from './server';
import browser from './browser';

declare var __NODE__: Boolean;

export default __NODE__ ? server : browser;
export {styled, withStyle, withStyleDeep, withTransform, withWrapper};
export {AtomicPrefixToken};
