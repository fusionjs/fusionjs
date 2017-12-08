/* eslint-env browser */

export default ({emit}) => {
  const _emit =
    (typeof emit === 'function' && emit) ||
    ((e, src) => {
      if (window.onerror) window.onerror(e.message, src, null, null, e);
    });
  for (const key in window) {
    if (
      key.match(/webkit/) == null && // stop deprecation warnings
      window[key] &&
      window[key].prototype &&
      window[key].prototype.addEventListener
    ) {
      const proto = window[key].prototype;
      const old = proto.addEventListener;
      proto.addEventListener = function(type, fn, ...rest) {
        const cb = function(...args) {
          try {
            return fn.apply(this, args);
          } catch (e) {
            // get exception stack frames from our own code rather than potentially from 3rd party CDN code to get around CORS issues
            _emit(e, 'async-event');
          }
        };
        return old.call(this, type, cb, ...rest);
      };
    }
  }
  window.addEventListener('unhandledrejection', e => {
    e.preventDefault();
    _emit(e.reason instanceof Error ? e.reason : new Error(e.reason));
  });
};
