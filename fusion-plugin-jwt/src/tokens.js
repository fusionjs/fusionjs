// @flow
import type {Token} from 'fusion-core';
import {createToken} from 'fusion-core';

export const SessionSecretToken: Token<string> = createToken('SessionSecret');
export const SessionCookieNameToken: Token<string> = createToken(
  'SessionCookieName'
);
export const SessionCookieExpiresToken: Token<number> = createToken(
  'SessionCookieExpires'
);
