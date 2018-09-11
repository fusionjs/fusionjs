/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';
import type {Fetch} from 'fusion-tokens';

const methods = {POST: 1, PUT: 1, PATCH: 1, DELETE: 1};

export function verifyMethod(
  method: string | $Keys<typeof methods>
): $Values<typeof methods> {
  return methods[method];
}
export function verifyExpiry(token: ?string, expire: number): boolean {
  if (!token) return false;
  const [timestamp] = token.split('-');
  const elapsed = Math.round(Date.now() / 1000) - Number(timestamp);
  if (isNaN(elapsed) || elapsed < 0 || elapsed >= expire) return false;
  return true;
}

export const CsrfExpireToken: Token<number> = createToken('CsrfExpireToken');
export const CsrfIgnoreRoutesToken: Token<Array<string>> = createToken(
  'CsrfIgnoreRoutesToken'
);
export const FetchForCsrfToken: Token<Fetch> = createToken('FetchForCsrfToken');
