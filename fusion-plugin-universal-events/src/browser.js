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
    const items = this.storage.getAndClear(this.limit);
    if (items.length === 0) return;

    try {
      const res = await this.fetch('/_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({items}),
      });
      if (!res.ok) {
        // If the server responds with a 413, it means the size of the payload was too large.
        // We handle this by cutting our limit in half for the next attempt.
        if (res.status === 413) {
          this.limit = this.limit / 2;
        }
        // sending failed so put the logs back into storage
        this.storage.addToStart(...items);
      }
    } catch (e) {
      // sending failed so put the logs back into storage
      this.storage.addToStart(...items);
    }
  }
  teardown(): void {
    window.removeEventListener('visibilitychange', this.flushBeforeTerminated);
    clearInterval(this.interval);
    this.interval = null;
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
