const ORDER_TRACKING_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ORDER_TRACKING_LENGTH = 16;
const ORDER_TRACKING_PREFIX = 'ord_';

function getTrackingSecret(env: Env) {
  const envValues = env as unknown as Record<string, string | undefined>;
  return (
    envValues.SESSION_SECRET ||
    envValues.SHOP_ID ||
    envValues.SHOPIFY_STORE_DOMAIN ||
    'translate3d-default-tracking-secret'
  );
}

function bytesToTrackingCode(bytes: Uint8Array) {
  let result = '';
  for (let index = 0; index < ORDER_TRACKING_LENGTH; index += 1) {
    const value = bytes[index % bytes.length] ?? 0;
    result += ORDER_TRACKING_ALPHABET[value % ORDER_TRACKING_ALPHABET.length];
  }
  return result;
}

export function isValidOrderTrackingReference(reference: string) {
  return /^ord_[a-zA-Z0-9]{16}$/.test(reference.trim());
}

export async function createOrderTrackingReference(env: Env, orderGid: string) {
  const secret = getTrackingSecret(env);
  const payload = `${secret}|${orderGid}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const trackingCode = bytesToTrackingCode(new Uint8Array(digest));
  return `${ORDER_TRACKING_PREFIX}${trackingCode}`;
}
