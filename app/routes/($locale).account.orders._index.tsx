import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/($locale).account.orders._index';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Pedidos'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('No se encontraron pedidos del cliente');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="flex flex-col gap-8">
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="account-orders" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="rounded-2xl border border-dark/10 bg-light p-6">
      {hasFilters ? (
        <>
          <p className="text-sm font-semibold text-dark">
            No se encontraron pedidos con esos filtros.
          </p>
          <div className="mt-3" />
          <p>
            <Link
              to="/account/orders"
              className="text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark"
            >
              Limpiar filtros →
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-dark">
            A&uacute;n no has realizado ning&uacute;n pedido.
          </p>
          <div className="mt-3" />
          <p>
            <Link
              to="/collections"
              className="text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark"
            >
              Ir a la tienda →
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dark/10 bg-light p-6"
      aria-label="Buscar pedidos"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="text-xs font-extrabold uppercase tracking-tight text-tgray">
          Filtrar pedidos
        </legend>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            name={ORDER_FILTER_FIELDS.NAME}
            placeholder="Pedido #"
            aria-label="N\u00famero de pedido"
            defaultValue={currentFilters.name || ''}
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="search"
            name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
            placeholder="Confirmaci\u00f3n #"
            aria-label="N\u00famero de confirmaci\u00f3n"
            defaultValue={currentFilters.confirmationNumber || ''}
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-lg border border-dark bg-dark px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-light hover:border-primary hover:bg-primary disabled:opacity-60"
          >
            {isSearching ? 'Buscando\u2026' : 'Buscar'}
          </button>
          {hasFilters && (
            <button
              type="button"
              disabled={isSearching}
              onClick={() => {
                setSearchParams(new URLSearchParams());
                formRef.current?.reset();
              }}
              className="rounded-lg border border-dark/20 bg-light px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-dark hover:border-dark hover:bg-lightgray disabled:opacity-60"
            >
              Limpiar
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  const processedDate = order.processedAt
    ? new Date(order.processedAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <>
      <div className="mt-6 rounded-2xl border border-dark/10 bg-light p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col">
            <Link
              to={`/account/orders/${btoa(order.id)}`}
              className="text-sm font-extrabold uppercase tracking-tight text-dark hover:text-primary"
            >
              Pedido #{order.number}
            </Link>
            <p className="mt-1 text-sm font-normal normal-case text-dark/70">
              {processedDate}
            </p>
          </div>
          <div className="text-sm font-extrabold text-dark">
            <Money data={order.totalPrice} />
          </div>
        </div>

        {order.confirmationNumber && (
          <p className="mt-3 text-sm font-normal normal-case text-dark/70">
            Confirmaci&oacute;n: {order.confirmationNumber}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-dark/15 bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-tight text-dark">
            {order.financialStatus}
          </span>
          {fulfillmentStatus ? (
            <span className="rounded-full border border-dark/15 bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-tight text-dark">
              {fulfillmentStatus}
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <Link
            to={`/account/orders/${btoa(order.id)}`}
            className="text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark"
          >
            Ver pedido →
          </Link>
        </div>
      </div>
    </>
  );
}
