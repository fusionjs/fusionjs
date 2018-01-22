/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function JWTBrowser() {
  return {
    from() {
      throw new Error('Cannot call JWT.from in the browser');
    },
  };
}
