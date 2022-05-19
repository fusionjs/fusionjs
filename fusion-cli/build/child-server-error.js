/** Copyright (c) 2022 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*::
type ChildServerErrorPayload = {
  name?: string,
  message?: string,
  stack?: string,
};
*/

class ChildServerError extends Error {
  constructor(payload /*: ChildServerErrorPayload */) {
    super(payload.message || 'Received an error from child');

    if (payload.name) {
      this.name = payload.name;
    }

    if (payload.stack) {
      this.stack = payload.stack;
    }
  }
}

module.exports = ChildServerError;
