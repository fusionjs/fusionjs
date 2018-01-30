/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nodeTimers from 'timers';

import {createToken, createOptionalToken} from 'fusion-tokens';

export const NodePerformanceEmitterToken = createToken(
  'NodePerformanceEmitterToken'
);

export const TimersToken = createOptionalToken(
  'TimersToken',
  __NODE__ ? nodeTimers : null
);

/* Configuration Tokens */
const CONFIG_DEFAULTS = {
  eventLoopLagInterval: 1000 * 10,
  memoryInterval: 1000 * 10,
  socketInterval: 1000 * 10,
};

export const EventLoopLagIntervalToken = createOptionalToken(
  'EventLoopLagIntervalToken',
  CONFIG_DEFAULTS.eventLoopLagInterval
);
export const MemoryIntervalToken = createOptionalToken(
  'MemoryIntervalToken',
  CONFIG_DEFAULTS.memoryInterval
);
export const SocketIntervalToken = createOptionalToken(
  'SocketIntervalToken',
  CONFIG_DEFAULTS.socketInterval
);
