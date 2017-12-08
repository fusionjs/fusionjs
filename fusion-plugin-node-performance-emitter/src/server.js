/* eslint-env node */
import profiler from 'gc-profiler';
import nodeTimers from 'timers';
import {globalAgent} from 'http';
import {Plugin} from 'fusion-core';

/* Constants */
const CONFIG_DEFAULTS = {
  eventLoopLagInterval: 1000 * 10,
  memoryInterval: 1000 * 10,
  socketInterval: 1000 * 10,
};

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

export default ({config, EventEmitter, timers = nodeTimers}) => {
  if (__DEV__ && !EventEmitter)
    throw new Error(`EventEmitter is required, but was: ${EventEmitter}`);

  const emit = (header, payload) => {
    EventEmitter.of().emit(`node-performance-emitter:${header}`, payload);
  };

  const p = new Plugin({
    Service: class NodePerformanceEmitter {
      constructor() {
        config = config || {};
        this.eventLoopLagInterval =
          config.eventLoopLagInterval || CONFIG_DEFAULTS.eventLoopLagInterval;
        this.memoryInterval =
          config.memoryInterval || CONFIG_DEFAULTS.memoryInterval;
        this.socketInterval =
          config.socketInterval || CONFIG_DEFAULTS.socketInterval;

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

        this.eventLoopLagIntervalRef = timers.setInterval(
          this.emitEventLoopLag.bind(this),
          this.eventLoopLagInterval
        );
      }

      stopTrackingEventLoopLag() {
        timers.clearInterval(this.eventLoopLagIntervalRef);
        this.eventLoopLagIntervalRef = null;
      }

      emitEventLoopLag(done) {
        done = done || noop;
        eventLoopLag(lag => {
          emit('gauge:event_loop_lag', lag);
          return done();
        });
      }

      /* Tracking Memory Usage */
      startTrackingMemoryUsage() {
        if (this.memoryIntervalRef)
          throw new Error(
            'Memory Usage is already being tracked.  Please stop previous instance before beginning a new one.'
          );

        this.memoryIntervalRef = timers.setInterval(
          this.emitMemoryUsage.bind(this),
          this.memoryInterval
        );
      }

      stopTrackingMemoryUsage() {
        timers.clearInterval(this.memoryIntervalRef);
        this.memoryIntervalRef = null;
      }

      emitMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        emit('gauge:externalMemory', memoryUsage.external);
        emit('gauge:rss', memoryUsage.rss);
        emit('gauge:heapTotal', memoryUsage.heapTotal);
        emit('gauge:heapUsed', memoryUsage.heapUsed);
      }

      /* Tracking Garbage Collection */
      startTrackingGCUsage() {
        if (this.isTrackingGarbageCollection)
          throw new Error(
            'Garbage Collection is already being tracked.  Please stop previous instance before beginning a new one.'
          );

        profiler.on('gc', info => {
          emit('timing:gc', {
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

        this.socketUsageIntervalRef = timers.setInterval(
          this.emitSocketUsage.bind(this),
          this.socketInterval
        );
      }

      stopTrackingSocketUsage() {
        timers.clearInterval(this.socketUsageIntervalRef);
        this.socketUsageIntervalRef = null;
      }

      emitSocketUsage() {
        // number of sockets currently in use
        emit(
          'gauge:globalAgentSockets',
          getCountFromGlobalAgent(globalAgent.sockets)
        );
        // number of requests that have not yet been assigned to sockets
        emit(
          'gauge:globalAgentRequests',
          getCountFromGlobalAgent(globalAgent.requests)
        );
        // number of free sockets
        emit(
          'gauge:globalAgentFreeSockets',
          getCountFromGlobalAgent(globalAgent.freeSockets)
        );
      }
    },
  });
  p.of().start();
  return p;
};
