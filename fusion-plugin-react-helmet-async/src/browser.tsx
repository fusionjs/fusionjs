/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {createPlugin} from 'fusion-core';
import {HelmetProvider} from 'react-helmet-async';

import type {FusionPlugin} from 'fusion-core';

const plugin =
  __BROWSER__ &&
  createPlugin({
    middleware: () => {
      return (ctx, next) => {
        ctx.element = (
          <HelmetProvider context={{}}>{ctx.element}</HelmetProvider>
        );
        return next();
      };
    },
  });

export default ((plugin: any): FusionPlugin<void, void>);
