/* @noflow */
/* eslint-env node */

export function now() {
  if (__BROWSER__) {
    if (window.performance && window.performance.now) {
      return Math.round(window.performance.now());
    }
    return Date.now();
  } else {
    const [seconds, ns] = process.hrtime();
    return Math.round(seconds * 1000 + ns / 1e6);
  }
}
