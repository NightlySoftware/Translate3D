import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).account.orders.$id';
import {Money, Image} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Pedido ${data?.order?.name}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Pedido no encontrado');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();

  const processedDate = order.processedAt
    ? new Date(order.processedAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-extrabold uppercase tracking-tight">
          Pedido {order.name}
        </h2>
        <p className="mt-1 text-sm font-normal normal-case text-dark/70">
          Realizado el {processedDate}
        </p>
        {order.confirmationNumber ? (
          <p className="mt-2 text-sm font-normal normal-case text-dark/70">
            Confirmaci&oacute;n: {order.confirmationNumber}
          </p>
        ) : null}
      </div>

      <div className="overflow-auto rounded-2xl border border-dark/10 bg-light">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-lightgray text-xs font-extrabold uppercase tracking-tight text-tgray">
            <tr>
              <th scope="col" className="px-4 py-3">
                Producto
              </th>
              <th scope="col" className="px-4 py-3">
                Precio
              </th>
              <th scope="col" className="px-4 py-3">
                Cantidad
              </th>
              <th scope="col" className="px-4 py-3">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark/10">
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </tbody>
          <tfoot className="bg-white">
            {((discountValue && discountValue.amount) || discountPercentage) ? (
              <tr className="border-t border-dark/10">
                <th scope="row" className="px-4 py-3" colSpan={3}>
                  Descuentos
                </th>
                <td className="px-4 py-3 font-semibold text-dark">
                  {discountPercentage ? (
                    <span>-{discountPercentage}%</span>
                  ) : discountValue ? (
                    <Money data={discountValue} />
                  ) : null}
                </td>
              </tr>
            ) : null}
            <tr className="border-t border-dark/10">
              <th scope="row" className="px-4 py-3" colSpan={3}>
                Subtotal
              </th>
              <td className="px-4 py-3 font-semibold text-dark">
                <Money data={order.subtotal!} />
              </td>
            </tr>
            <tr className="border-t border-dark/10">
              <th scope="row" className="px-4 py-3" colSpan={3}>
                Impuestos
              </th>
              <td className="px-4 py-3 font-semibold text-dark">
                <Money data={order.totalTax!} />
              </td>
            </tr>
            <tr className="border-t border-dark/10">
              <th scope="row" className="px-4 py-3" colSpan={3}>
                Total
              </th>
              <td className="px-4 py-3 font-extrabold text-dark">
                <Money data={order.totalPrice!} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-dark/10 bg-light p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-tight text-tgray">
            Direcci&oacute;n de env&iacute;o
          </h3>
          {order?.shippingAddress ? (
            <address className="mt-3 not-italic text-sm font-normal normal-case text-dark/80">
              <p className="font-semibold text-dark">{order.shippingAddress.name}</p>
              {order.shippingAddress.formatted ? (
                <p>{order.shippingAddress.formatted}</p>
              ) : null}
              {order.shippingAddress.formattedArea ? (
                <p>{order.shippingAddress.formattedArea}</p>
              ) : null}
            </address>
          ) : (
            <p className="mt-3 text-sm font-normal normal-case text-dark/70">
              No hay direcci&oacute;n de env&iacute;o definida.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-dark/10 bg-light p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-tight text-tgray">
            Estado
          </h3>
          <p className="mt-3 text-sm font-semibold text-dark">
            {fulfillmentStatus}
          </p>
          {order.statusPageUrl ? (
            <a
              target="_blank"
              href={order.statusPageUrl}
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark"
            >
              Ver estatus del pedido →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  return (
    <tr key={lineItem.id}>
      <td>
        <div className="flex items-start gap-3 px-4 py-3">
          {lineItem?.image && (
            <div className="h-16 w-16 overflow-hidden rounded-md border border-dark/10 bg-lightgray">
              <Image data={lineItem.image} width={96} height={96} />
            </div>
          )}
          <div className="flex flex-col">
            <p className="font-semibold text-dark">{lineItem.title}</p>
            <small className="text-dark/70">{lineItem.variantTitle}</small>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Money data={lineItem.price!} />
      </td>
      <td className="px-4 py-3">{lineItem.quantity}</td>
      <td className="px-4 py-3">
        <Money data={lineItem.totalDiscount!} />
      </td>
    </tr>
  );
}
