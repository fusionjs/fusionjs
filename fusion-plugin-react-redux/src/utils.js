/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const parseNamespace = (
  namespace?: ?string
): {suffix: string, cacheKey: string} => {
  const suffix = namespace !== undefined && namespace !== null ? namespace : '';
  const cacheKey =
    namespace !== undefined && namespace !== null
      ? namespace.toString()
      : 'default';
  return {suffix, cacheKey};
};
