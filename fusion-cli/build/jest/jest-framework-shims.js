/* eslint-env node */
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

// Parity with create-universal-package globals.
// https://github.com/rtsao/create-universal-package#globals
global.__BROWSER__ = Boolean(global.window);
global.__NODE__ = !global.__BROWSER__;
global.__DEV__ = process.env !== 'production';
