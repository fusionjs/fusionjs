/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import type {
  UniversalEventsDepsType,
  UniversalEventsType,
} from 'fusion-plugin-universal-events';

import plugin from './plugin';
import withBatchEvents from './hoc';

export default plugin;
export {withBatchEvents};
export {UniversalEventsToken};
export type {UniversalEventsDepsType, UniversalEventsType};
