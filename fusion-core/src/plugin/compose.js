// inline version of koa-compose to get around Rollup/CUP commonjs-related issue
function composeMiddleware(middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }
  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }

  return function(context, next) {
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(
          fn(context, function next() {
            return dispatch(i + 1);
          })
        );
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

export default function(plugins) {
  const middleware = plugins
    .map(p => {
      return p && typeof p.middleware === 'function' ? p.middleware.bind(p) : p;
    })
    .filter(Boolean);
  return composeMiddleware(middleware);
}
