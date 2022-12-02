/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default class ResponseError extends Error {
  code: string | undefined | null;
  meta: any;
  cause: unknown | undefined | null;
  severity:
    | typeof ResponseError.Severity[keyof typeof ResponseError.Severity]
    | undefined
    | null;

  static Severity = Object.freeze({
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
  });

  constructor(
    message: string,
    options?: {
      code?: string;
      meta?: any;
      cause?: unknown;
      severity?: typeof ResponseError.Severity[keyof typeof ResponseError.Severity];
    } | null
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
