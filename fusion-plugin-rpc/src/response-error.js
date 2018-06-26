/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default class ResponseError extends Error {
  code: ?string;
  meta: ?Object;

  constructor(message: string) {
    super(message);
    this.code = null;
    this.meta = null;
    Error.captureStackTrace(this, ResponseError);
  }
}
