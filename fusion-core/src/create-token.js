/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Token} from './types.js';
import {captureStackTrace} from './stack-trace.js';

export const TokenType = Object.freeze({
  Required: 0,
  Optional: 1,
});
function Ref() {}
export class TokenImpl<TResolved> {
  name: string;
  ref: mixed;
  type: $Values<typeof TokenType>;
  optional: ?TokenImpl<TResolved>;
  stacks: Array<{
    type: 'token' | 'register' | 'enhance' | 'alias-from' | 'alias-to',
    stack: string,
  }>;

  constructor(name: string, ref: mixed) {
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
  return ((new TokenImpl(name): any): Token<TResolvedType>);
}
