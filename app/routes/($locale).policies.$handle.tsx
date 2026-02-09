import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Translate3D | ${data?.policy.title ?? ''}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No se proporcion\u00f3 un handle', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('No se encontr\u00f3 la pol\u00edtica', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-16 text-dark">
      <Link
        to="/policies"
        className="text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark"
      >
        ← Volver a pol&iacute;ticas
      </Link>

      <h1 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        {policy.title}
      </h1>

      <div
        className="mt-8 text-base leading-relaxed text-dark/80 [&_a]:text-primary [&_a:hover]:text-dark [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-4"
        dangerouslySetInnerHTML={{__html: policy.body}}
      />
    </section>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
