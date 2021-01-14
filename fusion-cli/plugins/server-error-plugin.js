/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*::
import type {ServerErrorDepsType, ServerErrorType} from './types.js';
*/

import serverError from '../build/server-error';
import {createPlugin} from 'fusion-core';

/* eslint-disable-next-line */
export default createPlugin/*:: <ServerErrorDepsType, ServerErrorType> */(
  {
    middleware: () =>
      async function middleware(ctx, next) {
        try {
          await next();
        } catch (err) {
          ctx.status = err.statusCode || err.status || 500;
          ctx.body = serverError.renderHtmlError(err);
        }
      },
  }
);
