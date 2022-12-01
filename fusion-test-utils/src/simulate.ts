/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/* globals global */

import FusionApp, { compose } from "fusion-core";
import type { Context } from "fusion-core";

import { createRequestContext, createRenderContext } from "./mock-context";

export const request =
  (app: FusionApp) =>
  (url: string, options: any = {}): Promise<any> => {
    if (__BROWSER__) {
      throw new Error(
        "[fusion-test-utils] Request api not support from the browser. Please use `render` instead"
      );
    }
    const ctx = createRequestContext(url, options);
    return simulate(app, ctx);
  };

export const render =
  (app: FusionApp) =>
  (url: string, options: any = {}): Promise<any> => {
    if (global.jsdom) {
      if (!url.startsWith("/")) {
        url = `/${url}`;
      }
      global.jsdom.reconfigure({
        url: `http://localhost${url}`,
      });
    }
    const ctx = createRenderContext(url, options);
    return simulate(app, ctx);
  };

export default function simulate(app: FusionApp, ctx: Context): Promise<any> {
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
