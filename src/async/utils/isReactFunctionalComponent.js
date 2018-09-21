/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default function isReactFunctionalComponent(type: mixed) {
  if (
    typeof type === 'function' &&
    (type.prototype == null || !type.prototype.render)
  )
    return true;
  return false;
}
