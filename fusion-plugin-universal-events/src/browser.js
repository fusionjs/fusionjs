/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';
import Emitter from './emitter.js';
import type {
  IEmitter,
  UniversalEventsPluginDepsType as DepsType,
  BatchStorage,
} from './types.js';
import {
  UniversalEventsBatchStorageToken,
  localBatchStorage,
} from './storage/index.js';

export class UniversalEmitter extends Emitter {
  flush: any;
  fetch: Fetch;
  interval: any;
  storage: BatchStorage;
  limit: number;
  isFlushInProgress = false;
  hasFlushBeenScheduled = false;

  constructor(
    fetch: Fetch,
    storage: BatchStorage,
    interval?: number = 5000,
    limit?: number = 1000
  ): void {
    super();
    //privates
    this.storage = storage;
    this.flush = this.flushInternal.bind(this);
    this.fetch = fetch;
    this.setFrequency(interval);
    this.limit = limit;
    window.addEventListener('visibilitychange', this.flushBeforeTerminated);
  }
  setFrequency(frequency: number): void {
    window.clearInterval(this.interval);
    this.interval = setInterval(this.flush, frequency);
  }
  emit(type: mixed, payload: mixed): void {
    payload = super.mapEvent(type, payload);
    super.handleEvent(type, payload);
    this.storage.add({type, payload});
  }
  // match server api
  from(): UniversalEmitter {
    return this;
  }
  flushBeforeTerminated = () =>
    document.visibilityState === 'hidden' && this.flushInternal();
  async flushInternal(): Promise<void> {
    if (!this.startFlush()) {
      return;
    }
    // this is workaround to 'get' items and keep them in the storage
    const items = this.storage.getAndClear(this.limit);
    this.storage.addToStart(...items);

    if (items.length === 0) {
      this.finishFlush();
      return;
    }
    try {
      const res = await this.fetch('/_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({items}),
      });

      if (res.ok) {
        // clear only events that were sent, preserve ones that might be added while request was executed
        this.storage.getAndClear(items.length);
        this.finishFlush();
      } else {
        // If the server responds with a 413, it means the size of the payload was too large.
        // We handle this by cutting our limit in half for the next attempt.
        if (res.status === 413) {
          this.limit = this.limit / 2;
        }
        this.finishFlush();
      }
    } catch (e) {
      // do nothing here, items are still in the storage and will be sent on the next attempt
      this.finishFlush();
    }
  }
  teardown(): void {
    window.removeEventListener('visibilitychange', this.flushBeforeTerminated);
    clearInterval(this.interval);
    this.interval = null;
  }
  startFlush() {
    if (this.isFlushInProgress) {
      this.hasFlushBeenScheduled = true;
      return false;
    }
    this.isFlushInProgress = true;
    return true;
  }
  finishFlush() {
    this.isFlushInProgress = false;
    if (this.hasFlushBeenScheduled) {
      this.hasFlushBeenScheduled = false;
      this.flushInternal();
    }
  }
}

const plugin =
  __BROWSER__ &&
  createPlugin({
    deps: {
      fetch: FetchToken,
      storage: UniversalEventsBatchStorageToken.optional,
    },
    provides: ({fetch, storage}) => {
      return new UniversalEmitter(fetch, storage || localBatchStorage);
    },
    cleanup: async emitter => {
      return emitter.teardown();
    },
  });

export default ((plugin: any): FusionPlugin<DepsType, IEmitter>);
