const methods = {POST: 1, PUT: 1, PATCH: 1, DELETE: 1};

export function verifyMethod(method) {
  return methods[method];
}
export function verifyExpiry(token, expire) {
  if (!token) return false;
  const [timestamp] = token.split('-');
  const elapsed = Math.round(Date.now() / 1000) - Number(timestamp);
  if (isNaN(elapsed) || elapsed < 0 || elapsed >= expire) return false;
  return true;
}
