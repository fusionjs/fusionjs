/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {compose} from '../src/compose';

import type {Context} from '../src/types.js';

function getContext() {
  return __BROWSER__
    ? {}
    : {
        method: 'GET',
        path: '/',
        headers: {
          accept: 'text/html',
        },
      };
}

// $FlowFixMe
export function run(app: any, ctx: Context = {}) {
  // $FlowFixMe
  ctx = Object.assign(getContext(), ctx);
  app.resolve();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
