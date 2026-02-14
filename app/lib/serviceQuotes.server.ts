import {shopifyAdminGraphql} from '~/lib/shopifyAdmin.server';

const SERVICE_QUOTE_METAOBJECT_TYPE = 'service_quote_request';

type QuoteMode = 'modelado' | 'impresion';

export type ServiceQuoteRecord = {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  serviceMode: QuoteMode;
  status: string;
  summary: string;
  detailsJson: string;
  requestedAt: string;
  updatedAt: string;
};

type ServiceQuoteNode = {
  id: string;
  updatedAt: string;
  fields: Array<{key: string; value: string | null}>;
};

function randomSuffix(length: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => chars[value % chars.length]).join('');
}

export function generateQuoteOrderId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `COT-${datePart}-${randomSuffix(6)}`;
}

function fieldMap(fields: Array<{key: string; value: string | null}> | undefined) {
  const map = new Map<string, string>();
  for (const field of fields ?? []) {
    if (field.value != null) map.set(field.key, field.value);
  }
  return map;
}

function mapServiceQuoteNode(node: ServiceQuoteNode): ServiceQuoteRecord {
  const map = fieldMap(node.fields);
  return {
    id: node.id,
    orderId: map.get('order_id') || 'N/A',
    customerId: map.get('customer_gid') || '',
    customerName: map.get('customer_name') || 'Cliente',
    customerEmail: map.get('customer_email') || '',
    serviceMode: (map.get('service_mode') as QuoteMode) || 'impresion',
    status: map.get('status') || 'PENDING',
    summary: map.get('summary') || '',
    detailsJson: map.get('details_json') || '{}',
    requestedAt: map.get('requested_at') || node.updatedAt,
    updatedAt: node.updatedAt,
  };
}

async function ensureServiceQuoteDefinition(env: Env) {
  const definitionLookup = await shopifyAdminGraphql<{
    metaobjectDefinitionByType: {id: string} | null;
  }>(
    env,
    `
      query ServiceQuoteDefinition($type: String!) {
        metaobjectDefinitionByType(type: $type) {
          id
        }
      }
    `,
    {type: SERVICE_QUOTE_METAOBJECT_TYPE},
  );

  if (definitionLookup.metaobjectDefinitionByType?.id) {
    return;
  }

  const createResult = await shopifyAdminGraphql<{
    metaobjectDefinitionCreate: {
      userErrors: Array<{message: string}>;
    };
  }>(
    env,
    `
      mutation CreateServiceQuoteDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          userErrors {
            message
          }
        }
      }
    `,
    {
      definition: {
        name: 'Service Quote Request',
        type: SERVICE_QUOTE_METAOBJECT_TYPE,
        fieldDefinitions: [
          {name: 'Order ID', key: 'order_id', type: 'single_line_text_field'},
          {name: 'Customer GID', key: 'customer_gid', type: 'single_line_text_field'},
          {name: 'Customer Name', key: 'customer_name', type: 'single_line_text_field'},
          {name: 'Customer Email', key: 'customer_email', type: 'single_line_text_field'},
          {name: 'Service Mode', key: 'service_mode', type: 'single_line_text_field'},
          {name: 'Status', key: 'status', type: 'single_line_text_field'},
          {name: 'Summary', key: 'summary', type: 'multi_line_text_field'},
          {name: 'Details JSON', key: 'details_json', type: 'json'},
          {name: 'Requested At', key: 'requested_at', type: 'date_time'},
        ],
      },
    },
  );

  if (createResult.metaobjectDefinitionCreate.userErrors.length > 0) {
    throw new Error(createResult.metaobjectDefinitionCreate.userErrors[0]?.message || 'No se pudo crear la definicion de cotizaciones');
  }
}

export async function createServiceQuoteRequest(
  env: Env,
  input: {
    orderId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    serviceMode: QuoteMode;
    summary: string;
    details: Record<string, unknown>;
  },
) {
  await ensureServiceQuoteDefinition(env);

  const createResult = await shopifyAdminGraphql<{
    metaobjectCreate: {
      metaobject: {id: string} | null;
      userErrors: Array<{message: string}>;
    };
  }>(
    env,
    `
      mutation CreateServiceQuote($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      metaobject: {
        type: SERVICE_QUOTE_METAOBJECT_TYPE,
        handle: input.orderId.toLowerCase(),
        fields: [
          {key: 'order_id', value: input.orderId},
          {key: 'customer_gid', value: input.customerId},
          {key: 'customer_name', value: input.customerName || 'Cliente'},
          {key: 'customer_email', value: input.customerEmail || ''},
          {key: 'service_mode', value: input.serviceMode},
          {key: 'status', value: 'PENDING'},
          {key: 'summary', value: input.summary},
          {key: 'details_json', value: JSON.stringify(input.details)},
          {key: 'requested_at', value: new Date().toISOString()},
        ],
      },
    },
  );

  if (createResult.metaobjectCreate.userErrors.length > 0) {
    throw new Error(createResult.metaobjectCreate.userErrors[0]?.message || 'No se pudo guardar la cotizacion');
  }

  if (!createResult.metaobjectCreate.metaobject?.id) {
    throw new Error('No se pudo guardar la cotizacion');
  }

  return createResult.metaobjectCreate.metaobject.id;
}

export async function listServiceQuoteRequests(
  env: Env,
  options?: {
    customerId?: string;
    first?: number;
  },
) {
  await ensureServiceQuoteDefinition(env);

  const first = options?.first ?? 100;

  const result = await shopifyAdminGraphql<{
    metaobjects: {
      nodes: ServiceQuoteNode[];
    };
  }>(
    env,
    `
      query ServiceQuotes($type: String!, $first: Int!) {
        metaobjects(type: $type, first: $first) {
          nodes {
            id
            updatedAt
            fields {
              key
              value
            }
          }
        }
      }
    `,
    {
      type: SERVICE_QUOTE_METAOBJECT_TYPE,
      first,
    },
  );

  const normalized: ServiceQuoteRecord[] = result.metaobjects.nodes
    .map((node) => mapServiceQuoteNode(node))
    .filter((quote) => (options?.customerId ? quote.customerId === options.customerId : true))
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  return normalized;
}

export async function findServiceQuoteRequestByOrderId(env: Env, rawOrderId: string) {
  await ensureServiceQuoteDefinition(env);

  const orderId = rawOrderId.trim().toUpperCase();
  if (!orderId) return null;

  const byHandle = await shopifyAdminGraphql<{
    metaobjectByHandle: ServiceQuoteNode | null;
  }>(
    env,
    `
      query ServiceQuoteByHandle($type: String!, $handle: String!) {
        metaobjectByHandle(handle: {type: $type, handle: $handle}) {
          id
          updatedAt
          fields {
            key
            value
          }
        }
      }
    `,
    {
      type: SERVICE_QUOTE_METAOBJECT_TYPE,
      handle: orderId.toLowerCase(),
    },
  );

  if (byHandle.metaobjectByHandle) {
    return mapServiceQuoteNode(byHandle.metaobjectByHandle);
  }

  const recent = await listServiceQuoteRequests(env, {first: 200});
  return recent.find((quote) => quote.orderId.toUpperCase() === orderId) ?? null;
}

export async function findServiceQuoteRequestById(
  env: Env,
  quoteId: string,
  options?: {customerId?: string},
) {
  await ensureServiceQuoteDefinition(env);
  const normalizedId = quoteId.trim();
  if (!normalizedId) return null;

  const direct = await shopifyAdminGraphql<{
    metaobject: ServiceQuoteNode | null;
  }>(
    env,
    `
      query ServiceQuoteById($id: ID!) {
        metaobject(id: $id) {
          id
          updatedAt
          fields {
            key
            value
          }
        }
      }
    `,
    {id: normalizedId},
  );

  if (direct.metaobject) {
    const mapped = mapServiceQuoteNode(direct.metaobject);
    if (!options?.customerId || mapped.customerId === options.customerId) {
      return mapped;
    }
    return null;
  }

  const recent = await listServiceQuoteRequests(env, {first: 200, customerId: options?.customerId});
  return recent.find((quote) => quote.id === normalizedId) ?? null;
}

export async function updateServiceQuoteRequestStatus(
  env: Env,
  quoteId: string,
  status: string,
) {
  const normalizedId = quoteId.trim();
  const normalizedStatus = status.trim().toUpperCase();
  if (!normalizedId || !normalizedStatus) return false;

  const result = await shopifyAdminGraphql<{
    metaobjectUpdate: {
      metaobject: {id: string} | null;
      userErrors: Array<{message: string}>;
    };
  }>(
    env,
    `
      mutation UpdateServiceQuoteStatus($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      id: normalizedId,
      metaobject: {
        fields: [{key: 'status', value: normalizedStatus}],
      },
    },
  );

  if (result.metaobjectUpdate.userErrors.length > 0) {
    throw new Error(result.metaobjectUpdate.userErrors[0]?.message || 'No se pudo actualizar estado de cotizacion');
  }

  return Boolean(result.metaobjectUpdate.metaobject?.id);
}

export async function sendServiceQuoteResponseEmail(
  env: Env,
  input: {
    quoteId: string;
    quoteOrderId: string;
    serviceMode: string;
    customerEmail: string;
    customerName?: string;
    amount: string;
    currencyCode: string;
    message?: string;
  },
) {
  const amountNumber = Number(input.amount || '0');
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    throw new Error('Ingresa un monto valido para enviar la respuesta');
  }

  const toEmail = input.customerEmail.trim();
  if (!toEmail) {
    throw new Error('La cotizacion no tiene correo de cliente');
  }

  const draftCreate = await shopifyAdminGraphql<{
    draftOrderCreate: {
      draftOrder: {id: string; invoiceUrl: string | null; name: string | null} | null;
      userErrors: Array<{message: string}>;
    };
  }>(
    env,
    `
      mutation CreateServiceQuoteDraft($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            name
            invoiceUrl
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      input: {
        email: toEmail,
        note: `Respuesta cotizacion ${input.quoteOrderId}`,
        tags: ['cotizacion-servicio', 'respuesta-admin'],
        customAttributes: [
          {key: 'quote_id', value: input.quoteId},
          {key: 'quote_order_id', value: input.quoteOrderId},
          {key: 'service_mode', value: input.serviceMode},
        ],
        lineItems: [
          {
            title: `Cotizacion de servicio: ${input.serviceMode}`,
            quantity: 1,
            taxable: true,
            originalUnitPriceWithCurrency: {
              amount: amountNumber.toFixed(2),
              currencyCode: input.currencyCode || 'MXN',
            },
          },
        ],
      },
    },
  );

  if (draftCreate.draftOrderCreate.userErrors.length > 0) {
    throw new Error(draftCreate.draftOrderCreate.userErrors[0]?.message || 'No se pudo crear el borrador de respuesta');
  }

  const draftOrderId = draftCreate.draftOrderCreate.draftOrder?.id;
  if (!draftOrderId) {
    throw new Error('No se pudo crear el borrador de respuesta');
  }

  const subject = `Respuesta a tu cotizacion ${input.quoteOrderId}`;
  const defaultMessage = `Hola ${input.customerName || 'cliente'},\n\nTe compartimos la propuesta de cotizacion para ${input.serviceMode}. Revisa el enlace y completa el pago cuando lo desees.\n\nGracias,\nTranslate3D`;

  const invoiceSend = await shopifyAdminGraphql<{
    draftOrderInvoiceSend: {
      draftOrder: {id: string; invoiceUrl: string | null; name: string | null} | null;
      userErrors: Array<{message: string}>;
    };
  }>(
    env,
    `
      mutation SendServiceQuoteInvoice($id: ID!, $email: EmailInput) {
        draftOrderInvoiceSend(id: $id, email: $email) {
          draftOrder {
            id
            name
            invoiceUrl
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      id: draftOrderId,
      email: {
        to: toEmail,
        subject,
        customMessage: (input.message || '').trim() || defaultMessage,
      },
    },
  );

  if (invoiceSend.draftOrderInvoiceSend.userErrors.length > 0) {
    throw new Error(invoiceSend.draftOrderInvoiceSend.userErrors[0]?.message || 'No se pudo enviar el correo de respuesta');
  }

  await updateServiceQuoteRequestStatus(env, input.quoteId, 'IN_REVIEW');

  return {
    draftOrderId,
    draftOrderName: invoiceSend.draftOrderInvoiceSend.draftOrder?.name || '',
    invoiceUrl:
      invoiceSend.draftOrderInvoiceSend.draftOrder?.invoiceUrl ||
      draftCreate.draftOrderCreate.draftOrder?.invoiceUrl ||
      '',
  };
}
