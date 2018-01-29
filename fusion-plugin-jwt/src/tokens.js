// @flow
import {createToken, createOptionalToken} from 'fusion-tokens';

export const SessionSecretToken: string = createToken('SessionSecret');
export const SessionCookieNameToken: string = createToken('SessionCookieName');
export const SessionCookieExpiresToken: number = createOptionalToken(
  'SessionCookieExpires',
  86400
);
