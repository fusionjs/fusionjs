/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import type {FusionPlugin} from 'fusion-core';

import {Client as Styletron} from 'styletron-engine-monolithic';

import {injectDeclarationCompatMixin} from './inject-declaration-compat-mixin.js';
import getPlugin from './browser.js';

const StyletronCompat = injectDeclarationCompatMixin(Styletron);

function getStyletronEngine(config) {
  return new StyletronCompat(config);
}

const plugin = getPlugin(getStyletronEngine);

export default ((plugin: any): FusionPlugin<*, *>);
