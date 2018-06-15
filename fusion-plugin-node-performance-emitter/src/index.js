/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Main export file
import browser from './browser';
import server from './server';

export {
  NodePerformanceEmitterToken,
  TimersToken,
  EventLoopLagIntervalToken,
  MemoryIntervalToken,
  SocketIntervalToken,
} from './tokens';

const plugin = __BROWSER__ ? browser : server;
// Cast to typeof server for now to avoid requiring consumers to use refinements
export default ((plugin: any): typeof server);
