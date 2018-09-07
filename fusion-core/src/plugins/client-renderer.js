/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context} from '../types.js';

export default function createClientRenderer({render}: {render: any}) {
  return function renderer(ctx: Context, next: () => Promise<void>) {
    const rendered = render(ctx.element, ctx);
    if (rendered instanceof Promise) {
      return rendered.then(r => {
        ctx.rendered = r;
        return next();
      });
    } else {
      ctx.rendered = rendered;
      return next();
    }
  };
}
