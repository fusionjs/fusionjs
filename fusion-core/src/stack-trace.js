/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function captureStackTrace(caller: Function): string {
  // For monitoring in production, use a single format independent of browser
  if (__BROWSER__ && !__DEV__) {
    return new Error().stack;
  } else {
    if ('captureStackTrace' in Error) {
      const err = {};
      Error.captureStackTrace(err, caller);
      return err.stack;
    } else {
      return new Error().stack;
    }
  }
}
