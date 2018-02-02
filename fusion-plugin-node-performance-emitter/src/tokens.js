/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createToken} from 'fusion-core';

export const NodePerformanceEmitterToken = createToken(
  'NodePerformanceEmitterToken'
);

export const TimersToken = createToken('TimersToken');

export const EventLoopLagIntervalToken = createToken(
  'EventLoopLagIntervalToken'
);
export const MemoryIntervalToken = createToken('MemoryIntervalToken');
export const SocketIntervalToken = createToken('SocketIntervalToken');
