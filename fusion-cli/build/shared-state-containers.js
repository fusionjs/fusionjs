// @flow
/* eslint-env node */

class DeferredState /*::<T>*/ {
  /*::
  resolve: T => void;
  reject: T => void;
  result: Promise<T>;
  */
  constructor() {
    this.reset();
  }
  reset() {
    this.result = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

class SyncState /*::<T>*/ {
  /*::
  set: T => void;
  value: T
  */
  constructor(initialValue /*:T*/) {
    this.value = initialValue;
  }
  set(value /*:T*/) {
    this.value = value;
  }
}

class MergedDeferredState /*::<T, U>*/ {
  /*::
  states: Array<{
    deferred: DeferredState<T>,
    enabled: SyncState<boolean>,
  }>;
  mergeResultsFn: Array<T> => U;
  result: Promise<U>;
  */
  constructor(states /*: any */, mergeResultsFn /*: Array<T> => U */) {
    this.states = states;
    this.mergeResultsFn = mergeResultsFn;
  }
  get result() {
    return Promise.all(
      this.states
        .filter(state => state.enabled.value)
        .map(state => {
          return state.deferred.result;
        })
    ).then(resolved => {
      const result = this.mergeResultsFn(resolved);
      return result;
    });
  }
}

module.exports = {
  DeferredState,
  SyncState,
  MergedDeferredState,
};
