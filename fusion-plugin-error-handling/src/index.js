/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import serverPlugin from './server';
import clientPlugin from './client';

export default __NODE__ ? serverPlugin : clientPlugin;

export {ErrorHandlerToken, ErrorSerializerToken} from './server.js';
