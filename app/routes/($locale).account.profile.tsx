import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/($locale).account.profile';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Perfil'}];
};

export async function loader({context}: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'M\u00e9todo no permitido'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    // update customer and possibly password
    const {data, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('No se pudo actualizar el perfil.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      {error: error.message, customer: null},
      {
        status: 400,
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-extrabold uppercase tracking-tight">
          Perfil
        </h2>
        <p className="mt-1 text-sm font-normal normal-case text-dark/70">
          Actualiza tu informaci&oacute;n personal.
        </p>
      </div>

      <Form method="PUT" className="flex flex-col gap-4">
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="firstName"
              className="text-xs font-extrabold uppercase tracking-tight text-tgray"
            >
              Nombre
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Nombre"
              aria-label="Nombre"
              defaultValue={customer.firstName ?? ''}
              minLength={2}
              className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="lastName"
              className="text-xs font-extrabold uppercase tracking-tight text-tgray"
            >
              Apellido
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Apellido"
              aria-label="Apellido"
              defaultValue={customer.lastName ?? ''}
              minLength={2}
              className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </fieldset>

        {action?.error ? (
          <p className="text-sm font-normal normal-case text-red-600">
            {action.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={state !== 'idle'}
          className="rounded-lg border border-primary bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-light transition-colors hover:border-dark hover:bg-dark disabled:opacity-60"
        >
          {state !== 'idle' ? 'Actualizando…' : 'Actualizar'}
        </button>
      </Form>
    </div>
  );
}
