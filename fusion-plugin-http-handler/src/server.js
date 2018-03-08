/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */

import {createPlugin, memoize} from 'fusion-core';
import type {Context, FusionPlugin} from 'fusion-core';

const plugin =
  __NODE__ &&
  createPlugin({
    deps: {},

    provides: deps => {},

    middleware: deps => {},
  });

export default plugin;
