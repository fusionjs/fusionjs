/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import browserPlugin from './browser';
import serverPlugin from './server';

export default __NODE__ ? serverPlugin : browserPlugin();

export type * from './types';

export {
  ReduxToken,
  ReducerToken,
  PreloadedStateToken,
  EnhancerToken,
  GetInitialStateToken,
  ReduxDevtoolsConfigToken,
} from './tokens';
