/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import browser from './browser.js';
import server from './server.js';
import * as fs from './fs-store.js';

export type {
  IntrospectionSchema,
  Dependencies,
  Dependency,
  Metadata,
} from './server.js';

export default (__NODE__ ? server : browser);
// $FlowFixMe
export const fsStore = __NODE__ ? fs : undefined;
