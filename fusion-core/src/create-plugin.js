/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {captureStackTrace} from './stack-trace.js';

// eslint-disable-next-line flowtype/generic-spacing

export function createPlugin(opts) {
  return {
    __plugin__: true,
    stack: captureStackTrace(createPlugin),
    ...opts,
  };
}
