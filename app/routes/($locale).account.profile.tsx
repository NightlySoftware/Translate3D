import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import type {AddressFragment, CustomerFragment} from 'customer-accountapi.generated';
import {data, Form, useActionData, useFetcher, useNavigation, useOutletContext} from 'react-router';
import {useState} from 'react';
import type {Route} from './+types/($locale).account.profile';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {Button} from '~/components/ui/button';
import {shopifyAdminGraphql} from '~/lib/shopifyAdmin.server';
import {Input} from '~/components/ui/input';
import {AccountSectionLayout} from '~/components/account/AccountSectionLayout';
import {TagChip} from '~/components/landing/TagChip';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => [{title: 'Perfil'}];

export async function loader({context}: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();
  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Método no permitido'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as (typeof validInputKeys)[number])) continue;
      if (typeof value !== 'string') continue;
      const normalized = value.trim();
      if (!normalized.length) continue;
      customer[key as (typeof validInputKeys)[number]] = normalized;
    }

    const {data: mutationData, errors} = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
      variables: {
        customer,
        language: customerAccount.i18n.language,
      },
    });

    if (errors?.length) throw new Error(errors[0].message);

    const userErrors = mutationData?.customerUpdate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors[0]?.message || 'No se pudo actualizar el perfil.');
    }

    if (!mutationData?.customerUpdate?.customer) {
      throw new Error('No se pudo actualizar el perfil.');
    }

    const nextEmail = String(form.get('email') || '').trim();
    const nextPhone = String(form.get('phoneNumber') || '').trim();
    const initialEmail = String(form.get('_initialEmail') || '').trim();
    const initialPhone = String(form.get('_initialPhone') || '').trim();
    const emailChanged = nextEmail !== initialEmail;
    const phoneChanged = nextPhone !== initialPhone;

    if (emailChanged || phoneChanged) {
      const viewer = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
        variables: {language: customerAccount.i18n.language},
      });

      const customerId = viewer?.data?.customer?.id;
      if (customerId) {
        const profileUpdate = await shopifyAdminGraphql<{
          customerUpdate: {
            customer: {id: string} | null;
            userErrors: Array<{message: string}>;
          };
        }>(
          context.env,
          `
            mutation AccountProfileCustomerUpdate($input: CustomerInput!) {
              customerUpdate(input: $input) {
                customer {
                  id
                }
                userErrors {
                  message
                }
              }
            }
          `,
          {
            input: {
              id: customerId,
              ...(emailChanged ? {email: nextEmail} : {}),
              ...(phoneChanged ? {phone: nextPhone} : {}),
            },
          },
        );

        const updateErrors = profileUpdate.customerUpdate.userErrors || [];
        if (updateErrors.length > 0) {
          throw new Error(updateErrors[0]?.message || 'No se pudo actualizar correo o teléfono.');
        }
      }
    }

    return {
      error: null,
      customer: mutationData.customerUpdate.customer,
    };
  } catch (error: unknown) {
    return data(
      {error: error instanceof Error ? error.message : 'No se pudo actualizar.', customer: null},
      {status: 400},
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const actionData = useActionData<ActionResponse>();
  const customer = actionData?.customer ?? account.customer;
  const addresses = customer?.addresses?.nodes ?? [];
  const defaultAddressId = customer?.defaultAddress?.id || null;
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || 'Mi perfil';
  const email = (customer as any).emailAddress?.emailAddress || '';
  const phone = (customer as any).phoneNumber?.phoneNumber || '';

  return (
    <div className="space-y-5">
      <AccountSectionLayout
        title="Perfil"
        subtitle="Actualiza tu información personal."
        actions={<TagChip label={fullName} />}
      >
        <Form method="PUT" className="space-y-4">
          <input type="hidden" name="_initialEmail" value={email} />
          <input type="hidden" name="_initialPhone" value={phone} />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
                Nombre
              </label>
              <Input id="firstName" name="firstName" type="text" autoComplete="given-name" defaultValue={customer.firstName ?? ''} />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
                Apellido
              </label>
              <Input id="lastName" name="lastName" type="text" autoComplete="family-name" defaultValue={customer.lastName ?? ''} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
                Correo electrónico
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" defaultValue={email} />
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
                Número de teléfono
              </label>
              <Input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" defaultValue={phone} />
            </div>
          </div>

          {actionData?.error ? <p className="text-sm font-semibold text-primary">{actionData.error}</p> : null}

          <Button type="submit" variant="action" disabled={state !== 'idle'}>
            {state !== 'idle' ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Form>
      </AccountSectionLayout>

      <AccountSectionLayout
        title="Direcciones"
        subtitle="Agrega y edita tus direcciones sin salir de esta página."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowNewAddressForm((value) => !value);
              setEditingAddressId(null);
            }}
          >
            {showNewAddressForm ? 'Cerrar formulario' : '+ Agregar dirección'}
          </Button>
        }
      >
        {showNewAddressForm ? (
          <InlineAddressForm
            mode="create"
            onCancel={() => setShowNewAddressForm(false)}
            defaultChecked={addresses.length === 0}
          />
        ) : null}

        {addresses.length === 0 ? (
          <p className="text-sm text-dark/70">No tienes direcciones guardadas.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="space-y-3">
                <AddressCard
                  address={address}
                  isDefault={address.id === defaultAddressId}
                  onEdit={() => {
                    setShowNewAddressForm(false);
                    setEditingAddressId((current) => (current === address.id ? null : address.id));
                  }}
                />
                {editingAddressId === address.id ? (
                  <InlineAddressForm
                    mode="edit"
                    address={address}
                    defaultChecked={address.id === defaultAddressId}
                    onCancel={() => setEditingAddressId(null)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </AccountSectionLayout>

      <AccountSectionLayout title="Formas de pago" subtitle="Métodos gestionados en checkout seguro de Shopify.">
        <div className="max-w-[380px] rounded-2xl border border-dark/15 bg-light p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-tight text-dark/70">Crédito en tienda</p>
            <span className="rounded-full border border-dark/15 bg-white px-2 py-1 text-xs font-bold uppercase text-dark">
              MXN $
            </span>
          </div>
          <p className="mt-4 text-2xl font-extrabold tracking-tight">$0.00</p>
        </div>
      </AccountSectionLayout>
    </div>
  );
}

function AddressCard({
  address,
  isDefault,
  onEdit,
}: {
  address: AddressFragment;
  isDefault: boolean;
  onEdit: () => void;
}) {
  const title = [address.firstName, address.lastName].filter(Boolean).join(' ') || 'Dirección';

  return (
    <article className="rounded-2xl border border-dark/15 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base font-extrabold text-dark">{title}</p>
        {isDefault ? (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
            Predeterminada
          </span>
        ) : null}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-dark/80">
        {address.formatted?.join('\n') || address.address1 || ''}
      </p>
      {address.phoneNumber ? <p className="mt-2 text-sm text-dark/80">{address.phoneNumber}</p> : null}
      <button
        type="button"
        onClick={onEdit}
        className="mt-3 inline-flex rounded-md border border-dark/20 px-3 py-2 text-xs font-bold uppercase tracking-tight text-dark hover:border-primary hover:text-primary"
      >
        Editar dirección
      </button>
    </article>
  );
}

function InlineAddressForm({
  mode,
  address,
  defaultChecked = false,
  onCancel,
}: {
  mode: 'create' | 'edit';
  address?: AddressFragment;
  defaultChecked?: boolean;
  onCancel: () => void;
}) {
  const fetcher = useFetcher<{
    error?: Record<string, string> | string | null;
  }>();

  const isCreate = mode === 'create';
  const addressId = isCreate ? 'NEW_ADDRESS_ID' : String(address?.id || '');
  const key = String(addressId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fieldId = (name: string) => `${key}-${name}`;
  const rawError = fetcher.data?.error;
  const errorMessage =
    typeof rawError === 'string'
      ? rawError
      : rawError && typeof rawError === 'object'
        ? String((rawError as Record<string, string>)[addressId] || '')
        : '';

  return (
    <fetcher.Form method={isCreate ? 'post' : 'put'} action="../addresses" className="rounded-xl border border-dark/15 bg-light p-4">
      <input type="hidden" name="addressId" value={addressId} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={fieldId('firstName')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            Nombre
          </label>
          <Input id={fieldId('firstName')} name="firstName" required defaultValue={address?.firstName || ''} />
        </div>
        <div className="space-y-2">
          <label htmlFor={fieldId('lastName')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            Apellido
          </label>
          <Input id={fieldId('lastName')} name="lastName" required defaultValue={address?.lastName || ''} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor={fieldId('address1')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            Dirección
          </label>
          <Input id={fieldId('address1')} name="address1" required defaultValue={address?.address1 || ''} />
        </div>
        <div className="space-y-2">
          <label htmlFor={fieldId('city')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            Ciudad
          </label>
          <Input id={fieldId('city')} name="city" required defaultValue={address?.city || ''} />
        </div>
        <div className="space-y-2">
          <label htmlFor={fieldId('zoneCode')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            Estado
          </label>
          <Input id={fieldId('zoneCode')} name="zoneCode" required defaultValue={address?.zoneCode || ''} />
        </div>
        <div className="space-y-2">
          <label htmlFor={fieldId('zip')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            Código postal
          </label>
          <Input id={fieldId('zip')} name="zip" required defaultValue={address?.zip || ''} />
        </div>
        <div className="space-y-2">
          <label htmlFor={fieldId('territoryCode')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            País (código)
          </label>
          <Input id={fieldId('territoryCode')} name="territoryCode" required defaultValue={address?.territoryCode || 'MX'} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor={fieldId('phoneNumber')} className="text-xs font-extrabold uppercase tracking-tight text-dark/60">
            Teléfono
          </label>
          <Input id={fieldId('phoneNumber')} name="phoneNumber" defaultValue={address?.phoneNumber || ''} />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-dark/80">
        <input type="checkbox" name="defaultAddress" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-dark/30 text-primary" />
        Establecer como predeterminada
      </label>

      {errorMessage ? <p className="mt-3 text-sm font-semibold text-primary">{errorMessage}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" variant="action" size="sm" disabled={fetcher.state !== 'idle'}>
          {isCreate ? 'Guardar dirección' : 'Actualizar dirección'}
        </Button>
        {!isCreate ? (
          <Button formMethod="delete" type="submit" variant="secondary" size="sm" disabled={fetcher.state !== 'idle'}>
            Eliminar
          </Button>
        ) : null}
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </fetcher.Form>
  );
}
