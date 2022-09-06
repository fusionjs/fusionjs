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
  cause: ?mixed;
  severity: ?$Values<typeof ResponseError.Severity>;

  static Severity = Object.freeze({
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
  });

  constructor(
    message: string,
    options?: ?{
      code?: string,
      meta?: Object,
      cause?: mixed,
      severity?: $Values<typeof ResponseError.Severity>,
    }
  ) {
    super(message);
    const {code, meta, cause, severity} = options ?? {};
    this.code = code;
    this.meta = meta;
    this.cause = cause;
    this.severity = severity;
    Error.captureStackTrace(this, ResponseError);
  }
}
