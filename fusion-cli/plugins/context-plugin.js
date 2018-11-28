/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*
This is where new ctx properties should be initialized
*/

/*::
import type {ContextDepsType, ContextType} from './types';
*/
const getCompilationMetaData = require('../get-compilation-metadata.js');
const {createPlugin} = require('fusion-core');

/* eslint-disable-next-line */
export default createPlugin/*:: <ContextDepsType, ContextType> */(
  {
    middleware: () => {
      const compilationMetaData = getCompilationMetaData();
      return function middleware(ctx, next) {
        // webpack-related things
        ctx.syncChunks = compilationMetaData.syncChunks;
        ctx.chunkUrlMap = compilationMetaData.chunkUrlMap;
        return next();
      };
    },
  }
);
