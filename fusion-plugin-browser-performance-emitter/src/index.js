/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
import Server from './server.js';
import Browser from './browser.js';

declare var __BROWSER__: Boolean;
const BrowserPerformanceEmitter = __BROWSER__ ? Browser : Server;

export default BrowserPerformanceEmitter;
