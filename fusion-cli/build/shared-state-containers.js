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

module.exports = {
  DeferredState,
  SyncState,
};
