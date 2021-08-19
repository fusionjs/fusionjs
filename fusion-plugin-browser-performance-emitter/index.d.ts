/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

declare type BrowserPerfDepsType = {
  emitter: typeof UniversalEventsToken;
};

declare const BrowserPerformanceEmitter: fusion_core.FusionPlugin<
  BrowserPerfDepsType,
  void
>;

export {BrowserPerformanceEmitter as default};
