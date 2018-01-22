/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

// $FlowFixMe
import FusionApp, {compose} from 'fusion-core';
import type {Context} from 'fusion-core';

export default function simulate(app: FusionApp, ctx: Context): Promise<*> {
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
