/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';

const methods = {POST: 1, PUT: 1, PATCH: 1, DELETE: 1};

export function verifyMethod(
  method: string | keyof typeof methods
): typeof methods[keyof typeof methods] {
  return methods[method.toUpperCase()];
}
export const CsrfIgnoreRoutesToken: Token<Array<string>> = createToken(
  'CsrfIgnoreRoutesToken'
);
