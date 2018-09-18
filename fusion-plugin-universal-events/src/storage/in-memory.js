// @flow

import type {BatchStorage, BatchType} from '../types';

class InMemoryBatchStorage implements BatchStorage {
  data = [];

  add = (...toBeAdded: BatchType[]) => {
    this.data.push(...toBeAdded);
  };

  addToStart = (...toBeAdded: BatchType[]) => {
    this.data.unshift(...toBeAdded);
  };

  getAndClear = () => {
    const events = this.data;
    this.data = [];
    return events;
  };
}

export const inMemoryBatchStorage = new InMemoryBatchStorage();
