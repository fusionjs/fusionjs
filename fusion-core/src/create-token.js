/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {captureStackTrace} from './stack-trace.js';

export const TokenType = Object.freeze({
  Required: 0,
  Optional: 1,
});
function Ref() {}
export class TokenImpl {
  constructor(name, ref) {
    this.name = name;
    this.ref = ref || new Ref();
    this.type = ref ? TokenType.Optional : TokenType.Required;
    this.stacks = [{type: 'token', stack: captureStackTrace(createToken)}];
    if (!ref) {
      this.optional = new TokenImpl(name, this.ref);
    }
  }
}

export function createToken(name) {
  return new TokenImpl(name);
}

export function getTokenRef(token) {
  if (token instanceof TokenImpl) {
    return token.ref;
  }
  return token;
}
