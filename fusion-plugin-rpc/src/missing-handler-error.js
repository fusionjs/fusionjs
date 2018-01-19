/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class MissingHandlerError extends Error {
  constructor(method) {
    super(`Missing RPC handler for ${method}`);
    this.code = 'ERR_MISSING_HANDLER';
    Error.captureStackTrace(this, MissingHandlerError);
  }
}
