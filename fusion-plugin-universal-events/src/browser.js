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

class UniversalEmitter extends Emitter {
  flush: any;
  fetch: any;
  interval: any;
  storage: BatchStorage;

  constructor(fetch: Fetch, storage: BatchStorage): void {
    super();
    //privates
    this.storage = storage;
    this.flush = this.flushInternal.bind(this);
    this.fetch = fetch;
    this.setFrequency(5000);
    window.addEventListener('beforeunload', this.flush);
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
  async flushInternal(): Promise<void> {
    const items = this.storage.getAndClear();
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
        // sending failed so put the logs back into storage
        this.storage.addToStart(...items);
      }
    } catch (e) {
      // sending failed so put the logs back into storage
      this.storage.addToStart(...items);
    }
  }
  teardown(): void {
    window.removeEventListener('beforeunload', this.flush);
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
