/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

import type {Middleware} from 'fusion-core';

import PrepareProvider from './prepare-provider';

const middleware: Middleware = function(ctx, next) {
  if (__NODE__ && !ctx.element) {
    return next();
  }
  ctx.element = (
    <PrepareProvider preloadChunks={ctx.preloadChunks}>
      {ctx.element}
    </PrepareProvider>
  );
  return next();
};

export default middleware;
