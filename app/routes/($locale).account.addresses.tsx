import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type {Route} from './+types/($locale).account.addresses';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Direcciones'}];
};

export async function loader({context}: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('Debes proporcionar un id de direcci\u00f3n.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'No autorizado'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('No se pudo crear la direcci\u00f3n.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('No se pudo actualizar la direcci\u00f3n.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('No se pudo eliminar la direcci\u00f3n.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'M\u00e9todo no permitido'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return data(
      {error},
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-extrabold uppercase tracking-tight">
          Direcciones
        </h2>
        <p className="mt-1 text-sm font-normal normal-case text-dark/70">
          Administra tus direcciones de env&iacute;o.
        </p>
      </div>

      <div className="rounded-2xl border border-dark/10 bg-light p-5">
        <p className="text-xs font-extrabold uppercase tracking-tight text-tgray">
          Nueva direcci&oacute;n
        </p>
        <div className="mt-4">
          <NewAddressForm />
        </div>
      </div>

      {!addresses.nodes.length ? (
        <p className="text-sm font-normal normal-case text-dark/70">
          No tienes direcciones guardadas.
        </p>
      ) : (
        <div className="rounded-2xl border border-dark/10 bg-light p-5">
          <ExistingAddresses
            addresses={addresses}
            defaultAddress={defaultAddress}
          />
        </div>
      )}
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({stateForMethod}) => (
        <div>
          <button
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
            className="rounded-lg border border-primary bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-light transition-colors hover:border-dark hover:bg-dark disabled:opacity-60"
          >
            {stateForMethod('POST') !== 'idle' ? 'Creando\u2026' : 'Crear'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-tight text-tgray">
        Direcciones guardadas
      </p>
      <div className="mt-4 flex flex-col gap-6">
        {addresses.nodes.map((address) => (
          <AddressForm
            key={address.id}
            addressId={address.id}
            address={address}
            defaultAddress={defaultAddress}
          >
            {({stateForMethod}) => (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={stateForMethod('PUT') !== 'idle'}
                  formMethod="PUT"
                  type="submit"
                  className="rounded-lg border border-dark bg-dark px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-light hover:border-primary hover:bg-primary disabled:opacity-60"
                >
                  {stateForMethod('PUT') !== 'idle'
                    ? 'Guardando\u2026'
                    : 'Guardar'}
                </button>
                <button
                  disabled={stateForMethod('DELETE') !== 'idle'}
                  formMethod="DELETE"
                  type="submit"
                  className="rounded-lg border border-dark/20 bg-light px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-dark hover:border-dark hover:bg-lightgray disabled:opacity-60"
                >
                  {stateForMethod('DELETE') !== 'idle'
                    ? 'Eliminando\u2026'
                    : 'Eliminar'}
                </button>
              </div>
            )}
          </AddressForm>
        ))}
      </div>
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  const safeId = String(addressId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fieldId = (name: string) => `${safeId}-${name}`;
  return (
    <Form
      id={addressId}
      className="rounded-xl border border-dark/10 bg-white p-4"
    >
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="addressId" defaultValue={addressId} />
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('firstName')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Nombre*
          </label>
          <input
            aria-label="Nombre"
            autoComplete="given-name"
            defaultValue={address?.firstName ?? ''}
            id={fieldId('firstName')}
            name="firstName"
            placeholder="Nombre"
            required
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('lastName')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Apellido*
          </label>
          <input
            aria-label="Apellido"
            autoComplete="family-name"
            defaultValue={address?.lastName ?? ''}
            id={fieldId('lastName')}
            name="lastName"
            placeholder="Apellido"
            required
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('company')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Empresa
          </label>
          <input
            aria-label="Empresa"
            autoComplete="organization"
            defaultValue={address?.company ?? ''}
            id={fieldId('company')}
            name="company"
            placeholder="Empresa"
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label
            htmlFor={fieldId('address1')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Direcci&oacute;n l&iacute;nea 1*
          </label>
          <input
            aria-label="Direcci\u00f3n l\u00ednea 1"
            autoComplete="address-line1"
            defaultValue={address?.address1 ?? ''}
            id={fieldId('address1')}
            name="address1"
            placeholder="Direcci\u00f3n l\u00ednea 1"
            required
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label
            htmlFor={fieldId('address2')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Direcci&oacute;n l&iacute;nea 2
          </label>
          <input
            aria-label="Direcci\u00f3n l\u00ednea 2"
            autoComplete="address-line2"
            defaultValue={address?.address2 ?? ''}
            id={fieldId('address2')}
            name="address2"
            placeholder="Direcci\u00f3n l\u00ednea 2"
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('city')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Ciudad*
          </label>
          <input
            aria-label="Ciudad"
            autoComplete="address-level2"
            defaultValue={address?.city ?? ''}
            id={fieldId('city')}
            name="city"
            placeholder="Ciudad"
            required
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('zoneCode')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Estado / Provincia*
          </label>
          <input
            aria-label="Estado/Provincia"
            autoComplete="address-level1"
            defaultValue={address?.zoneCode ?? ''}
            id={fieldId('zoneCode')}
            name="zoneCode"
            placeholder="Estado / Provincia"
            required
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('zip')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            C&oacute;digo postal*
          </label>
          <input
            aria-label="C\u00f3digo postal"
            autoComplete="postal-code"
            defaultValue={address?.zip ?? ''}
            id={fieldId('zip')}
            name="zip"
            placeholder="C\u00f3digo postal"
            required
            type="text"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('territoryCode')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Pa&iacute;s (c&oacute;digo)*
          </label>
          <input
            aria-label="Pa\u00eds (c\u00f3digo)"
            autoComplete="country"
            defaultValue={address?.territoryCode ?? ''}
            id={fieldId('territoryCode')}
            name="territoryCode"
            placeholder="MX"
            required
            type="text"
            maxLength={2}
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={fieldId('phoneNumber')}
            className="text-xs font-extrabold uppercase tracking-tight text-tgray"
          >
            Tel\u00e9fono
          </label>
          <input
            aria-label="Tel\u00e9fono"
            autoComplete="tel"
            defaultValue={address?.phoneNumber ?? ''}
            id={fieldId('phoneNumber')}
            name="phoneNumber"
            placeholder="+521234567890"
            pattern="^\\+?[1-9]\\d{3,14}$"
            type="tel"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            defaultChecked={isDefaultAddress}
            id={fieldId('defaultAddress')}
            name="defaultAddress"
            type="checkbox"
            className="h-4 w-4 rounded border-dark/30 text-primary"
          />
          <label
            htmlFor={fieldId('defaultAddress')}
            className="text-sm font-normal normal-case text-dark/80"
          >
            Establecer como direcci&oacute;n principal
          </label>
        </div>
        {error ? (
          <p className="text-sm font-normal normal-case text-red-600 sm:col-span-2">
            {error}
          </p>
        ) : null}
        {children({
          stateForMethod: (method) => (formMethod === method ? state : 'idle'),
        })}
      </fieldset>
    </Form>
  );
}
