/* eslint-env node */
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};
