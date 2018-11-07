/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import type {Middleware} from 'fusion-core';

import PrepareProvider from './prepare-provider';

const middleware: Middleware = function(ctx, next) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('The {middleware} export from fusion-react is deprecated.');
  }

  if (__NODE__ && !ctx.element) {
    return next();
  }

  const markAsCritical = __NODE__
    ? chunkId => {
        // Push to legacy context for backwards compat w/ legacy SSR template
        ctx.preloadChunks.push(chunkId);
      }
    : noop;
  ctx.element = (
    <PrepareProvider markAsCritical={markAsCritical}>
      {ctx.element}
    </PrepareProvider>
  );
  return next();
};

export default middleware;

function noop() {}
