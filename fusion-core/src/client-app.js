/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env browser */
import {compose} from './compose.js';
import timing, {TimingToken} from './plugins/timing';
import BaseApp from './base-app';
import createClientHydrate, {
  getSerializedRoutePrefix,
} from './plugins/client-hydrate';
import createClientRenderer from './plugins/client-renderer';
import {RenderToken, ElementToken} from './tokens';

export default function(): typeof BaseApp {
  return class ClientApp extends BaseApp {
    constructor(el, render) {
      super(el, render);
      this.register(TimingToken, timing);
      this.middleware({element: ElementToken}, createClientHydrate);
    }
    resolve() {
      this.middleware({render: RenderToken}, createClientRenderer);
      return super.resolve();
    }
    callback() {
      this.resolve();
      const middleware = compose(this.plugins);
      return () => {
        // TODO(#62): Create noop context object to match server api
        const routePrefix = getSerializedRoutePrefix();
        const replaceRouteRegex = new RegExp(`^${routePrefix}`);
        const ctx: any = {
          url: (window.location.pathname + window.location.search).replace(
            replaceRouteRegex,
            ''
          ),
          element: null,
          body: null,
        };
        return middleware(ctx, () => Promise.resolve()).then(() => ctx);
      };
    }
  };
}
