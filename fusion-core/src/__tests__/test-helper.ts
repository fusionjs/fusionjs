/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {compose} from '../compose';

import type {Context} from '../types';

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

// @ts-expect-error
export function run(app: any, ctx: Context = {}) {
  ctx = Object.assign(getContext(), ctx);
  app.resolve();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
