import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/($locale).policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Translate3D | Pol\u00edticas'}];
};

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No se encontraron pol\u00edticas', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-16 text-dark">
      <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        Pol&iacute;ticas
      </h1>

      <div className="mt-10 flex flex-col gap-3">
        {policies.map((policy) => (
          <Link
            key={policy.id}
            to={`/policies/${policy.handle}`}
            className="rounded-2xl border border-dark/10 bg-light p-6 text-sm font-extrabold uppercase tracking-tight text-dark transition-colors hover:border-primary hover:text-primary"
          >
            {policy.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
