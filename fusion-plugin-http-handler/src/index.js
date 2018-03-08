/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
import browser from './browser';
import server from './server';

declare var __BROWSER__: Boolean;
const plugin = __BROWSER__ ? browserDataFetching : serverDataFetching;

export default plugin;
