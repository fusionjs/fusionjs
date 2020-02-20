/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import './async-prepare-render.node.js';
import './async-prepare-context.node.js';
import './async-split.node.js';
import './async-context.node.js';

process.on('unhandledRejection', e => {
  throw e;
});
