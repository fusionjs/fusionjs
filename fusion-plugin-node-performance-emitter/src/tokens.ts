/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';

export type Timers = {
  setInterval: (b: Function, a: number) => number;
  clearInterval: (a: number) => void;
};

export const NodePerformanceEmitterToken: Token<any> = createToken(
  'NodePerformanceEmitterToken'
);

export const TimersToken: Token<Timers> = createToken('TimersToken');

export const EventLoopLagIntervalToken: Token<number> = createToken(
  'EventLoopLagIntervalToken'
);
export const MemoryIntervalToken: Token<number> = createToken(
  'MemoryIntervalToken'
);
export const SocketIntervalToken: Token<number> = createToken(
  'SocketIntervalToken'
);
