/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Token} from './types';
import {captureStackTrace} from './stack-trace';

export const TokenType = Object.freeze({
  Required: 0,
  Optional: 1,
});
function Ref() {}
export class TokenImpl<TResolved> {
  name: string;
  ref: unknown;
  type: typeof TokenType[keyof typeof TokenType];
  optional: TokenImpl<TResolved> | undefined;
  stacks: Array<{
    type: 'token' | 'register' | 'enhance' | 'alias-from' | 'alias-to';
    stack: string;
  }>;

  constructor(name: string, ref?: unknown) {
    this.name = name;
    this.ref = ref || new Ref();
    this.type = ref ? TokenType.Optional : TokenType.Required;
    this.stacks = [{type: 'token', stack: captureStackTrace(createToken)}];
    if (!ref) {
      this.optional = new TokenImpl(name, this.ref);
    }
  }
}

export function createToken<TResolvedType>(name: string): Token<TResolvedType> {
  return new TokenImpl(name) as any as Token<TResolvedType>;
}

export function getTokenRef(token) {
  if (token instanceof TokenImpl) {
    return token.ref;
  }
  return token;
}
