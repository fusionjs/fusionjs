/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {compose} from '../src/compose';

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

export function run(app, ctx = {}) {
  ctx = Object.assign(getContext(), ctx);
  app.resolve();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
