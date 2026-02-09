/**
 * Minimal end-to-end verification against the Shopify Storefront API.
 *
 * This is meant to catch "it's fake" regressions by proving we can fetch:
 * - Featured blog articles (handle: blog)
 * - Landing collections (modelos-3d, filamentos, resinas, refacciones)
 * - Best-sellers collection (handle: best-sellers)
 *
 * Env (either set is fine):
 * - PUBLIC_STORE_DOMAIN / SHOPIFY_STORE_DOMAIN
 * - PUBLIC_STOREFRONT_API_TOKEN / SHOPIFY_STOREFRONT_API_TOKEN
 * - SHOPIFY_STOREFRONT_API_VERSION (optional, default 2025-01)
 */

type Json = Record<string, any>;

export {};

function requiredEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizeDomain(domain: string) {
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

async function storefrontRequest<T = Json>(input: {
  storeDomain: string;
  token: string;
  apiVersion: string;
  query: string;
  variables?: Record<string, any>;
}) {
  const url = `https://${input.storeDomain}/api/${input.apiVersion}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': input.token,
    },
    body: JSON.stringify({query: input.query, variables: input.variables ?? {}}),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Storefront API request failed (${res.status} ${res.statusText})\n${text}`,
    );
  }

  const json = JSON.parse(text) as {data?: any; errors?: Array<{message: string}>};
  if (json.errors?.length) {
    throw new Error(
      `Storefront API GraphQL errors:\n${json.errors
        .map((e) => `- ${e.message}`)
        .join('\n')}`,
    );
  }
  return json.data as T;
}

function assert(ok: unknown, message: string) {
  if (!ok) throw new Error(message);
}

async function main() {
  const storeDomain = normalizeDomain(
    process.env.PUBLIC_STORE_DOMAIN ??
      process.env.SHOPIFY_STORE_DOMAIN ??
      '',
  );
  const token =
    process.env.PUBLIC_STOREFRONT_API_TOKEN ??
    process.env.SHOPIFY_STOREFRONT_API_TOKEN;
  const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2025-01';

  requiredEnv('PUBLIC_STORE_DOMAIN or SHOPIFY_STORE_DOMAIN', storeDomain);
  requiredEnv(
    'PUBLIC_STOREFRONT_API_TOKEN or SHOPIFY_STOREFRONT_API_TOKEN',
    token,
  );

  console.warn(`Verifying Storefront API: ${storeDomain} (${apiVersion})`);

  const data = await storefrontRequest<{
    blog: {handle: string; articles: {nodes: Array<{id: string}>}} | null;
    modelos3d: {id: string} | null;
    filamentos: {id: string} | null;
    resinas: {id: string} | null;
    refacciones: {id: string} | null;
    bestSellers: {id: string; products: {nodes: Array<{id: string}>}} | null;
  }>({
    storeDomain,
    token: token!,
    apiVersion,
    query: `#graphql
      query VerifyLandingData($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
        blog(handle: "blog") {
          handle
          articles(first: 4) {
            nodes { id }
          }
        }
        modelos3d: collection(handle: "modelos-3d") { id }
        filamentos: collection(handle: "filamentos") { id }
        resinas: collection(handle: "resinas") { id }
        refacciones: collection(handle: "refacciones") { id }
        bestSellers: collection(handle: "best-sellers") {
          id
          products(first: 10) { nodes { id } }
        }
      }
    `,
  });

  assert(data.blog, 'Missing blog handle "blog". Did you run seed-shopify?');
  assert(
    (data.blog?.articles?.nodes?.length ?? 0) >= 1,
    'Blog "blog" has no articles.',
  );

  assert(data.modelos3d, 'Missing collection handle "modelos-3d".');
  assert(data.filamentos, 'Missing collection handle "filamentos".');
  assert(data.resinas, 'Missing collection handle "resinas".');
  assert(data.refacciones, 'Missing collection handle "refacciones".');

  assert(data.bestSellers, 'Missing collection handle "best-sellers".');
  assert(
    (data.bestSellers?.products?.nodes?.length ?? 0) >= 1,
    'Collection "best-sellers" has no products.',
  );

  console.warn('OK: landing data is present and fetchable.');
}

await main();
