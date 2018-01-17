// @flow
import {createOptionalToken} from 'fusion-tokens';

const methods = {POST: 1, PUT: 1, PATCH: 1, DELETE: 1};

export function verifyMethod(method: string) {
  return methods[method];
}
export function verifyExpiry(token: string, expire: number) {
  if (!token) return false;
  const [timestamp] = token.split('-');
  const elapsed = Math.round(Date.now() / 1000) - Number(timestamp);
  if (isNaN(elapsed) || elapsed < 0 || elapsed >= expire) return false;
  return true;
}

export const CSRFTokenExpire = createOptionalToken('CSRFTokenExpire', 86400);
export const CSRFIgnoreRoutes: Array<string> = createOptionalToken(
  'CSRFIgnoreRoutes',
  []
);
