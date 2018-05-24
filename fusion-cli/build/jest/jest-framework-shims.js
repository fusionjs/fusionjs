/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

// Parity with create-universal-package globals.
// https://github.com/rtsao/create-universal-package#globals
global.__BROWSER__ = Boolean(global.window);
global.__NODE__ = !global.__BROWSER__;
global.__DEV__ = process.env !== 'production';
