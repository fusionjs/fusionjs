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

import serverAtomic from './server-atomic';
import serverMonolithic from './server-monolithic';
import browserAtomic from './browser-atomic';
import browserMonolithic from './browser-monolithic';

declare var __NODE__: Boolean;

const StyletronMonolithicPlugin = __NODE__
  ? serverMonolithic
  : browserMonolithic;

export default __NODE__ ? serverAtomic : browserAtomic;
export {styled, withStyle, withStyleDeep, withTransform, withWrapper};
export {AtomicPrefixToken};
export {StyletronMonolithicPlugin};
