/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import client from './plugin-client';
import server from './plugin-server';
export default (__BROWSER__ ? client : server);
