/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {Helmet, HelmetProvider} from 'react-helmet-async';
import serverPlugin from './server';
import clientPlugin from './browser';

declare var __NODE__: Boolean;
export default __NODE__ ? serverPlugin : clientPlugin;
export {Helmet, HelmetProvider};
