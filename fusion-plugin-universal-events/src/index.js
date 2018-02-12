/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
import {createToken} from 'fusion-core';
import ServerEvents from './server.js';
import BrowserEvents from './browser.js';

const UniversalEvents = __BROWSER__ ? BrowserEvents : ServerEvents;

export default UniversalEvents;

export const UniversalEventsToken = createToken('UniversalEventsToken');
