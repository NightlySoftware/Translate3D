export function encodeRouteToken(value: string) {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function decodeRouteToken(token: string) {
  const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
  const missingPadding = normalized.length % 4;
  const padded = missingPadding ? normalized + '='.repeat(4 - missingPadding) : normalized;
  return atob(padded);
}
