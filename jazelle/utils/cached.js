// @flow

function cachedArity2(fn /*: (a: string, b: string) => any */) /*: any */ {
  let cache = new Map();
  return function(a, b) {
    let key = a + b;
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(a, b);
    cache.set(key, result);
    return result;
  };
}

function cachedArity1(fn /*: (a: string) => any */) /*: any */ {
  let cache = new Map();
  return function(a) {
    let key = a;
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(a);
    cache.set(key, result);
    return result;
  };
}

module.exports = {cachedArity1, cachedArity2};
