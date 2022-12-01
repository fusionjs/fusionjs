/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ServerLogger from './server.js';
import BrowserLogger from './browser.js';

export default __BROWSER__ ? BrowserLogger : ServerLogger;

export {UniversalLoggerConfigToken} from './tokens';
