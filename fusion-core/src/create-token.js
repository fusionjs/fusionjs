// @flow

export const TokenType = {
  Required: 0,
  Optional: 1,
};
function Ref() {}
export class TokenImpl {
  name: string;
  ref: mixed;
  type: $Values<typeof TokenType>;
  optional: ?TokenImpl;

  constructor(name: string, ref: mixed) {
    this.name = name;
    this.ref = ref || new Ref();
    this.type = ref ? TokenType.Optional : TokenType.Required;
    if (!ref) {
      this.optional = new TokenImpl(name, this.ref);
    }
  }
}

export function createToken(name: string): Token<any> {
  // $FlowFixMe
  return new TokenImpl(name);
}
