/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default function isReactCompositeComponent(type: mixed) {
  if (
    type != null &&
    type instanceof Function &&
    type.prototype != null &&
    typeof type.prototype.render === 'function'
  ) {
    return true;
  }
  return false;
}
