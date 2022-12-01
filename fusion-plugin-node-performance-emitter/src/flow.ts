/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {
  TimersToken,
  EventLoopLagIntervalToken,
  MemoryIntervalToken,
  SocketIntervalToken,
} from './tokens';

export type NodePerformanceDepsType = {
  emitter: typeof UniversalEventsToken,
  timers?: typeof TimersToken.optional,
  eventLoopLagInterval?: typeof EventLoopLagIntervalToken.optional,
  memoryInterval?: typeof MemoryIntervalToken.optional,
  socketInterval?: typeof SocketIntervalToken.optional,
};
