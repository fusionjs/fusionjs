/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */
import {createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import type {Fetch} from 'fusion-tokens';
import Emitter from './emitter';
import type {
  IEmitter,
  UniversalEventsPluginDepsType as DepsType,
  BatchStorage,
} from './types';
import {UniversalEventsBatchStorageToken} from './storage/index';
import {inMemoryBatchStorage} from './storage/in-memory';

// The Beacon API rejects requests with big payloads and the size limit
// depends on the user agent. The limit in Chrome is 64KB and it is supposed
// to be at least the same also for the other browsers, even if they did not
// release any official information.
const BEACON_PAYLOAD_SIZE_LIMIT = 60000;

// The bodyparser used server-side has a default 1mb limit
const XHR_PAYLOAD_SIZE_LIMIT = 1048576;

declare global {
  // https://github.com/uber/fusionjs/issues/1577
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __ROUTE_PREFIX__?: string;
  }
}

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
    interval: number = 5000,
    limit: number = 1000
  ) {
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
  emit(type: string, payload: unknown): void {
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

    // Navigator has to be bound to ensure it does not error in some browsers
    // https://xgwang.me/posts/you-may-not-know-beacon/#it-may-throw-error%2C-be-sure-to-catch
    const sendBeacon =
      navigator.sendBeacon && navigator.sendBeacon.bind(navigator);

    const payloadSizelimit = sendBeacon
      ? BEACON_PAYLOAD_SIZE_LIMIT
      : XHR_PAYLOAD_SIZE_LIMIT;

    const itemsToSend = [];
    let isLargePayload = false;
    let jsonSize = 12; // Base payload is `{"items":[]}`
    for (let i = 0, l = items.length; i < l; i += 1) {
      const itemJSON = JSON.stringify(items[i]);
      const jsonItemSize = new Blob([itemJSON]).size;
      if (jsonItemSize + jsonSize < payloadSizelimit) {
        itemsToSend.push(itemJSON);
        jsonSize += jsonItemSize + (itemsToSend.length > 1 ? 1 : 0);
      } else {
        if (i === 0) {
          // single item is larger than payload size limit
          isLargePayload = true;
          itemsToSend.push(itemJSON);
        }
        break;
      }
    }
    const payload = `{"items":[${itemsToSend.join(',')}]}`;

    if (sendBeacon && !isLargePayload) {
      // Not sending Blob with Content-Type: 'application/json' because it throws in some old browsers.
      // It has been temporary disabled due to a CORS-related bug - CORS preflight checks were not
      // performed in sendBeacon using Blob with a not-simple content type.
      // See http://crbug.com/490015
      const prefix = window.__ROUTE_PREFIX__ || '';
      const eventsURL = prefix + '/_events';

      let sendBeaconResult = false;
      try {
        // Only wrap this line inside try catch just to be surgical.
        sendBeaconResult = sendBeacon(eventsURL, payload);
      } catch (e) {
        // Do nothing. If sendBeaconResult is false, we will fallback to using `this.fetch` below.
      }

      if (sendBeaconResult) {
        this.storage.getAndClear(itemsToSend.length);
        this.finishFlush();
        return;
      }
    }

    try {
      const res = await this.fetch('/_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (res.ok) {
        // clear only events that were sent, preserve ones that might be added while request was executed
        this.storage.getAndClear(itemsToSend.length);
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
  createPlugin<
    {
      fetch: typeof FetchToken;
      storage: typeof UniversalEventsBatchStorageToken.optional;
    },
    IEmitter
  >({
    deps: {
      fetch: FetchToken,
      storage: UniversalEventsBatchStorageToken.optional,
    },
    provides: ({fetch, storage}) => {
      return new UniversalEmitter(fetch, storage || inMemoryBatchStorage);
    },
    cleanup: async (emitter) => {
      return emitter.teardown();
    },
  });

export default plugin as any as FusionPlugin<DepsType, IEmitter>;
