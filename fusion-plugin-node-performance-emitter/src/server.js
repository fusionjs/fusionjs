/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */
import profiler from 'gc-profiler';
import nodeTimers from 'timers';
import {globalAgent} from 'http';
import assert from 'assert';

import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {
  TimersToken,
  EventLoopLagIntervalToken,
  MemoryIntervalToken,
  SocketIntervalToken,
} from './tokens';

/* Helper Functions */
function getCountFromGlobalAgent(data) {
  let numUnassigned = 0;
  const domains = Object.keys(data);
  for (let x = 0; x < domains.length; x++) {
    const domain = data[domains[x]];
    if (domain && domain.length) {
      numUnassigned += domain.length;
    }
  }
  return numUnassigned;
}

function eventLoopLag(cb) {
  const time = process.hrtime();
  setImmediate(function nextLoop() {
    const diff = process.hrtime(time);
    return cb(diff[0] * 1e9 + diff[1]);
  });
}

function noop() {}

/* Service */
class NodePerformanceEmitter {
  constructor(config, emit, timers) {
    assert.ok(config);
    assert.ok(emit);
    assert.ok(timers);

    this.eventLoopLagInterval = config.eventLoopLagInterval;
    this.memoryInterval = config.memoryInterval;
    this.socketInterval = config.socketInterval;

    this.emit = emit;

    this.timers = timers;

    // Track running timers
    this.socketUsageIntervalRef = null;
    this.eventLoopLagIntervalRef = null;
    this.memoryIntervalRef = null;
    this.isTrackingGarbageCollection = false;
  }

  /* PRODUCTIVITY API */
  start() {
    this.startTrackingEventLoopLag();
    this.startTrackingMemoryUsage();
    this.startTrackingGCUsage();
    this.startTrackingSocketUsage();
  }

  stop() {
    this.stopTrackingEventLoopLag();
    this.stopTrackingMemoryUsage();
    this.stopTrackingGCUsage();
    this.stopTrackingSocketUsage();
  }

  /* POWER API */
  /* Tracking Lag */
  startTrackingEventLoopLag() {
    if (this.eventLoopLagIntervalRef)
      throw new Error(
        'Event Loop Lag is already being tracked.  Please stop previous instance before beginning a new one.'
      );

    this.eventLoopLagIntervalRef = this.timers.setInterval(
      this.emitEventLoopLag.bind(this),
      this.eventLoopLagInterval
    );
  }

  stopTrackingEventLoopLag() {
    this.timers.clearInterval(this.eventLoopLagIntervalRef);
    this.eventLoopLagIntervalRef = null;
  }

  emitEventLoopLag(done) {
    done = done || noop;
    eventLoopLag(lag => {
      this.emit('gauge:event_loop_lag', lag);
      return done();
    });
  }

  /* Tracking Memory Usage */
  startTrackingMemoryUsage() {
    if (this.memoryIntervalRef)
      throw new Error(
        'Memory Usage is already being tracked.  Please stop previous instance before beginning a new one.'
      );

    this.memoryIntervalRef = this.timers.setInterval(
      this.emitMemoryUsage.bind(this),
      this.memoryInterval
    );
  }

  stopTrackingMemoryUsage() {
    this.timers.clearInterval(this.memoryIntervalRef);
    this.memoryIntervalRef = null;
  }

  emitMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    this.emit('gauge:externalMemory', memoryUsage.external);
    this.emit('gauge:rss', memoryUsage.rss);
    this.emit('gauge:heapTotal', memoryUsage.heapTotal);
    this.emit('gauge:heapUsed', memoryUsage.heapUsed);
  }

  /* Tracking Garbage Collection */
  startTrackingGCUsage() {
    if (this.isTrackingGarbageCollection)
      throw new Error(
        'Garbage Collection is already being tracked.  Please stop previous instance before beginning a new one.'
      );

    profiler.on('gc', info => {
      this.emit('timing:gc', {
        duration: info.duration,
        type: info.type,
        forced: info.forced,
      });
    });
  }

  stopTrackingGCUsage() {
    profiler.removeAllListeners('gc');
    this.isTrackingGarbageCollection = false;
  }

  /* Tracking Socket Usage */
  startTrackingSocketUsage() {
    if (this.socketUsageIntervalRef)
      throw new Error(
        'Socket Usage is already being tracked.  Please stop previous instance before beginning a new one.'
      );

    this.socketUsageIntervalRef = this.timers.setInterval(
      this.emitSocketUsage.bind(this),
      this.socketInterval
    );
  }

  stopTrackingSocketUsage() {
    this.timers.clearInterval(this.socketUsageIntervalRef);
    this.socketUsageIntervalRef = null;
  }

  emitSocketUsage() {
    // number of sockets currently in use
    this.emit(
      'gauge:globalAgentSockets',
      getCountFromGlobalAgent(globalAgent.sockets)
    );
    // number of requests that have not yet been assigned to sockets
    this.emit(
      'gauge:globalAgentRequests',
      getCountFromGlobalAgent(globalAgent.requests)
    );
    // number of free sockets
    this.emit(
      'gauge:globalAgentFreeSockets',
      getCountFromGlobalAgent(globalAgent.freeSockets)
    );
  }
}

/* Plugin */
const plugin = createPlugin({
  deps: {
    emitter: UniversalEventsToken,
    timers: TimersToken,

    /* Config */
    eventLoopLagInterval: EventLoopLagIntervalToken,
    memoryInterval: MemoryIntervalToken,
    socketInterval: SocketIntervalToken,
  },
  provides: ({
    emitter,
    timers = nodeTimers,
    eventLoopLagInterval,
    memoryInterval,
    socketInterval,
  }) => {
    const config = {
      eventLoopLagInterval: eventLoopLagInterval,
      memoryInterval: memoryInterval,
      socketInterval: socketInterval,
    };
    const emit = (header, payload) => {
      emitter.emit(`node-performance-emitter:${header}`, payload);
    };

    const service = new NodePerformanceEmitter(config, emit, timers);
    service.start();

    return service;
  },
});

export default plugin;
