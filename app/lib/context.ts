import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {getLocaleFromRequest} from '~/lib/i18n';

// Define the additional context object
const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
  // These will be available as both context.propertyName and context.get(propertyContext)
  // Example of complex objects that could be added:
  // cms: await createCMSClient(env),
  // reviews: await createReviewsClient(env),
} as const;

// Automatically augment HydrogenAdditionalContext with the additional context type
type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  // Hydrogen's runtime expects these env keys. Provide sane defaults where possible so local
  // development doesn't require the full set up-front.
  const safeEnv = {
    ...env,
    PUBLIC_CHECKOUT_DOMAIN: env.PUBLIC_CHECKOUT_DOMAIN ?? env.PUBLIC_STORE_DOMAIN,
    PRIVATE_STOREFRONT_API_TOKEN:
      env.PRIVATE_STOREFRONT_API_TOKEN ?? env.PUBLIC_STOREFRONT_API_TOKEN,
    PUBLIC_CUSTOMER_ACCOUNT_API_URL:
      env.PUBLIC_CUSTOMER_ACCOUNT_API_URL ??
      (env.SHOP_ID ? `https://shopify.com/${env.SHOP_ID}` : ''),
  } as Env;

  const isPlaceholder = (value?: string) =>
    !value ||
    value.includes('REPLACE_ME') ||
    value.includes('your-store.myshopify.com') ||
    value.includes('tu-tienda.myshopify.com');

  if (isPlaceholder(safeEnv.PUBLIC_STORE_DOMAIN)) {
    throw new Error(
      'PUBLIC_STORE_DOMAIN no est\u00e1 configurado (usa tu dominio real, ej: tu-tienda.myshopify.com)',
    );
  }
  if (isPlaceholder(safeEnv.PUBLIC_CHECKOUT_DOMAIN)) {
    throw new Error(
      'PUBLIC_CHECKOUT_DOMAIN no est\u00e1 configurado (si no tienes uno, usa el mismo valor que PUBLIC_STORE_DOMAIN)',
    );
  }
  if (isPlaceholder(safeEnv.PUBLIC_STOREFRONT_API_TOKEN)) {
    throw new Error(
      'PUBLIC_STOREFRONT_API_TOKEN no est\u00e1 configurado (token p\u00fablico Storefront API)',
    );
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env: safeEnv,
      request,
      cache,
      waitUntil,
      session,
      // Or detect from URL path based on locale subpath, cookies, or any other strategy
      i18n: getLocaleFromRequest(request),
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}
