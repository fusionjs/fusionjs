/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {Token} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

declare type Timers = {
  setInterval: (b: Function, a: number) => number;
  clearInterval: (a: number) => void;
};
declare const NodePerformanceEmitterToken: Token<any>;
declare const TimersToken: Token<Timers>;
declare const EventLoopLagIntervalToken: Token<number>;
declare const MemoryIntervalToken: Token<number>;
declare const SocketIntervalToken: Token<number>;

declare type NodePerformanceDepsType = {
  emitter: typeof UniversalEventsToken;
  timers?: typeof TimersToken.optional;
  eventLoopLagInterval?: typeof EventLoopLagIntervalToken.optional;
  memoryInterval?: typeof MemoryIntervalToken.optional;
  socketInterval?: typeof SocketIntervalToken.optional;
};

declare class NodePerformanceEmitter {
  gc: any;
  eventLoopLagInterval: number;
  memoryInterval: number;
  socketInterval: number;
  emit: (b: string, a: any) => void;
  timers: Timers;
  socketUsageIntervalRef: number;
  eventLoopLagIntervalRef: number;
  memoryIntervalRef: number;
  isTrackingGarbageCollection: boolean;
  constructor(
    config: {
      eventLoopLagInterval: number;
      memoryInterval: number;
      socketInterval: number;
    },
    emit: (b: string, a: any) => void,
    timers: Timers
  );
  start(): void;
  stop(): void;
  startTrackingEventLoopLag(): void;
  stopTrackingEventLoopLag(): void;
  emitEventLoopLag(done: Function): void;
  startTrackingMemoryUsage(): void;
  stopTrackingMemoryUsage(): void;
  emitMemoryUsage(): void;
  startTrackingGCUsage(): void;
  stopTrackingGCUsage(): void;
  startTrackingSocketUsage(): void;
  stopTrackingSocketUsage(): void;
  emitSocketUsage(): void;
}

declare const _default: fusion_core.FusionPlugin<
  NodePerformanceDepsType,
  NodePerformanceEmitter
>;

export {
  EventLoopLagIntervalToken,
  MemoryIntervalToken,
  NodePerformanceEmitterToken,
  SocketIntervalToken,
  TimersToken,
  _default as default,
};
