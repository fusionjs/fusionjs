/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

// $FlowFixMe
const {TextEncoder, TextDecoder} = require('util');

process.on('unhandledRejection', (e) => {
  throw e;
});

// Parity with create-universal-package globals.
// https://github.com/rtsao/create-universal-package#globals
global.__BROWSER__ = Boolean(global.window);
global.__NODE__ = !global.__BROWSER__;
global.__DEV__ = process.env !== 'production';

// Needed for React 18 Enzyme compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (__NODE__) {
  // fixes issue when react testing library is pulled into node test
  process.env.RTL_SKIP_AUTO_CLEANUP = 'true';
}
