/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env node */
import type { FusionPlugin } from "fusion-core";

import { Server as Styletron } from "styletron-engine-atomic";

import { injectDeclarationCompatMixin } from "./inject-declaration-compat-mixin";
import getPlugin from "./server";

const StyletronCompat = injectDeclarationCompatMixin(Styletron);

function getStyletronEngine(config) {
  return new StyletronCompat(config);
}

const plugin = getPlugin(getStyletronEngine);

export default plugin as any as FusionPlugin<any, any>;
