/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Adapted from: https://github.com/mithriljs/mithril.js/promise
 */

/* eslint-env browser */
/* global setImmediate, setTimeout */
// eslint-disable-next-line import/no-mutable-exports
var Promise = function(executor /*: any */) {
  if (!(this instanceof Promise))
    throw new Error('Promise must be called with `new`');
  if (typeof executor !== 'function')
    throw new TypeError('executor must be a function');

  var self = this,
    resolvers = [],
    rejectors = [],
    resolveCurrent = handler(resolvers, true),
    rejectCurrent = handler(rejectors, false);
  var instance = (self._instance = {
    resolvers: resolvers,
    rejectors: rejectors,
  });
  var callAsync =
    typeof setImmediate === 'function' ? setImmediate : setTimeout;
  function handler(list, shouldAbsorb) {
    return function execute(value) {
      var then;
      try {
        if (
          shouldAbsorb &&
          value != null &&
          (typeof value === 'object' || typeof value === 'function') &&
          typeof (then = value.then) === 'function'
        ) {
          if (value === self)
            throw new TypeError("Promise can't be resolved w/ itself");
          // $FlowFixMe
          executeOnce(then.bind(value));
        } else {
          callAsync(function() {
            if (!shouldAbsorb && list.length === 0) {
              dispatchUnhandledRejectionEvent(self, value);
            }
            for (var i = 0; i < list.length; i++) list[i](value);
            resolvers.length = 0;
            rejectors.length = 0;
            // $FlowFixMe
            instance.state = shouldAbsorb;
            // $FlowFixMe
            instance.retry = function() {
              execute(value);
            };
          });
        }
      } catch (e) {
        rejectCurrent(e);
      }
    };
  }
  function executeOnce(then) {
    var runs = 0;
    function run(fn) {
      return function(value) {
        if (runs++ > 0) return;
        fn(value);
      };
    }
    var onerror = run(rejectCurrent);
    try {
      then(run(resolveCurrent), onerror);
    } catch (e) {
      onerror(e);
    }
  }
  executeOnce(executor);
};
Promise.prototype.then = function(onFulfilled, onRejection) {
  var self = this,
    instance = self._instance;
  function handle(callback, list, next, state) {
    list.push(function(value) {
      // $FlowFixMe
      if (typeof callback !== 'function') next(value);
      else {
        try {
          resolveNext(callback(value));
        } catch (e) {
          if (rejectNext) rejectNext(e);
        }
      }
    });
    if (typeof instance.retry === 'function' && state === instance.state)
      instance.retry();
  }
  var resolveNext, rejectNext;
  var promise = new Promise(function(resolve, reject) {
    resolveNext = resolve;
    rejectNext = reject;
  });
  handle(onFulfilled, instance.resolvers, resolveNext, true);
  handle(onRejection, instance.rejectors, rejectNext, false);
  return promise;
};
Promise.prototype.catch = function(onRejection) {
  return this.then(null, onRejection);
};
Promise.resolve = function(value) {
  if (value instanceof Promise) return value;
  return new Promise(function(resolve) {
    resolve(value);
  });
};
Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};
Promise.all = function(list) {
  return new Promise(function(resolve, reject) {
    var total = list.length,
      count = 0,
      values = [];
    if (list.length === 0) resolve([]);
    else {
      for (var n = 0; n < list.length; n++) {
        (function(i) {
          function consume(value) {
            count++;
            values[i] = value;
            if (count === total) resolve(values);
          }
          if (
            list[i] != null &&
            (typeof list[i] === 'object' || typeof list[i] === 'function') &&
            typeof list[i].then === 'function'
          ) {
            list[i].then(consume, reject);
          } else {
            consume(list[i]);
          }
        })(n);
      }
    }
  });
};
Promise.race = function(list) {
  return new Promise(function(resolve, reject) {
    for (var i = 0; i < list.length; i++) {
      list[i].then(resolve, reject);
    }
  });
};

// From: https://github.com/rtsao/browser-unhandled-rejection/

function dispatchUnhandledRejectionEvent(promise, reason) {
  // $FlowFixMe
  const event = document.createEvent('Event');
  /**
   * Note: these properties should not be enumerable, which is the default setting
   */
  Object.defineProperties(event, {
    promise: {
      value: promise,
      writable: false,
    },
    reason: {
      value: reason,
      writable: false,
    },
  });
  event.initEvent(
    'unhandledrejection', // Define that the event name is 'unhandledrejection'
    false, // PromiseRejectionEvent is not bubbleable
    true // PromiseRejectionEvent is cancelable
  );
  window.dispatchEvent(event);
}

export default Promise;
