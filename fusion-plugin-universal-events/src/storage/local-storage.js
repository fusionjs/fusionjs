// @flow
/* global window */

import type {BatchType, BatchStorage} from '../types';
import {inMemoryBatchStorage} from './in-memory';
import {split} from './split';

const storageKey = 'fusion-events';

const get = () => {
  try {
    const events = JSON.parse(window.localStorage.getItem(storageKey));
    return Array.isArray(events) ? events : [];
  } catch (e) {
    return [];
  }
};

const set = (events: BatchType[]) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  } catch (e) {
    // storage might be full, do nothing
  }
};

class LocalBatchStorage implements BatchStorage {
  add = (...toBeAdded: BatchType[]) => {
    set(get().concat(toBeAdded));
  };

  addToStart = (...toBeAdded: BatchType[]) => {
    set(toBeAdded.concat(get()));
  };

  getAndClear = (limit?: number = Infinity): BatchType[] => {
    const allEvents = get();
    const [eventsToSend, eventsToStore] = split(allEvents, limit);
    set(eventsToStore);
    return eventsToSend;
  };
}

let isLocalStorageWritable = true;

try {
  window.localStorage.setItem('test', 'test');
  window.localStorage.removeItem('test');
} catch (e) {
  // if set/remove item fails localStorage is not writable
  // fallback to in-memory storage
  isLocalStorageWritable = false;
}

export const localBatchStorage = isLocalStorageWritable
  ? new LocalBatchStorage()
  : inMemoryBatchStorage;
