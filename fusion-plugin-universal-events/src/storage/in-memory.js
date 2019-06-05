// @flow

import type {BatchStorage, BatchType} from '../types';
import {split} from './split';

class InMemoryBatchStorage implements BatchStorage {
  data: BatchType[] = [];

  add = (...toBeAdded: BatchType[]) => {
    this.data.push(...toBeAdded);
  };

  addToStart = (...toBeAdded: BatchType[]) => {
    this.data.unshift(...toBeAdded);
  };

  getAndClear = (limit?: number = Infinity): BatchType[] => {
    const allEvents = this.data;
    const [eventsToSend, eventsToStore] = split(allEvents, limit);
    this.data = eventsToStore;
    return eventsToSend;
  };
}

export const inMemoryBatchStorage = new InMemoryBatchStorage();
