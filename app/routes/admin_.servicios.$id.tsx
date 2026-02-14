import { Form, data, redirect, useActionData, useLoaderData } from 'react-router';
import type { Route } from './+types/admin_.servicios.$id';
import { AdminSidebar } from '~/components/admin/AdminSidebar';
import { ExternalLink, Menu } from 'lucide-react';
import { useState } from 'react';
import { TagChip } from '~/components/landing/TagChip';
import { Button } from '~/components/ui/button';
import { isAdminCustomer } from '~/lib/shopifyAdmin.server';
import { findServiceQuoteRequestById, sendServiceQuoteResponseEmail } from '~/lib/serviceQuotes.server';
import { decodeRouteToken } from '~/lib/urlTokens';

export const meta: Route.MetaFunction = ({ data }) => [
  { title: data?.quote ? `${data.quote.orderId} | Servicios Admin` : 'Detalle de cotizacion | Admin' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes('approved') || value.includes('completed')) {
    return 'border-green-600/25 bg-green-50 text-green-700';
  }
  if (value.includes('rejected') || value.includes('cancel')) {
    return 'border-red-600/25 bg-red-50 text-red-700';
  }
  return 'border-primary/30 bg-primary/10 text-primary';
}

function statusPillClasses(status: string) {
  const value = status.toUpperCase();
  if (value.includes('APPROVED') || value.includes('COMPLETED')) {
    return 'bg-emerald-50 text-emerald-600';
  }
  if (value.includes('REJECTED') || value.includes('CANCEL')) {
    return 'bg-red-50 text-red-600';
  }
  return 'bg-amber-50 text-amber-600';
}

function formatQuoteStatus(status: string) {
  const key = status.toUpperCase();
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_REVIEW: 'En revisión',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELED: 'Cancelada',
    COMPLETED: 'Completada',
  };
  return labels[key] || key.replace(/_/g, ' ').toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    mode: 'Servicio',
    printType: 'Tipo de impresión',
    material: 'Material',
    color: 'Color',
    scale: 'Escala',
    sizeX: 'Tamaño X',
    sizeY: 'Tamaño Y',
    sizeZ: 'Tamaño Z',
    instructions: 'Instrucciones',
    modelFiles: 'Archivos del modelo',
    referenceFiles: 'Archivos de referencia',
    companyName: 'Empresa',
    phoneNumber: 'Teléfono',
    contactName: 'Nombre',
    contactEmail: 'Correo',
  };
  return labels[key] || key;
}

async function getAdminViewer(context: Route.LoaderArgs['context']) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return { ok: false as const, redirectTo: '/account/login' };
  }

  const { data: customerData, errors } = await context.customerAccount.query(ADMIN_CUSTOMER_QUERY, {
    variables: {
      language: context.customerAccount.i18n.language,
    },
  });

  if (errors?.length || !customerData?.customer?.id) {
    return { ok: false as const, redirectTo: '/account' };
  }

  const canAccessAdmin = await isAdminCustomer(context.env, customerData.customer.id);
  if (!canAccessAdmin) {
    return { ok: false as const, redirectTo: '/account' };
  }

  return {
    ok: true as const,
    accountName:
      [customerData.customer.firstName, customerData.customer.lastName].filter(Boolean).join(' ').trim() ||
      customerData.customer.emailAddress?.emailAddress ||
      'Mi perfil',
  };
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const viewer = await getAdminViewer(context);
  if (!viewer.ok) {
    return redirect(viewer.redirectTo);
  }

  if (!params.id) {
    return redirect('/admin?view=servicios-solicitudes');
  }

  let quoteId = params.id;
  try {
    quoteId = decodeRouteToken(params.id);
  } catch {
    try {
      quoteId = decodeURIComponent(params.id);
    } catch {
      quoteId = params.id;
    }
  }

  const quote = await findServiceQuoteRequestById(context.env, quoteId);
  if (!quote) {
    throw new Response('Cotización no encontrada', { status: 404 });
  }

  let details: Record<string, unknown> = {};
  try {
    details = asRecord(JSON.parse(quote.detailsJson || '{}'));
  } catch {
    details = {};
  }

  const shopifyNumericId = quote.id?.split('/').pop() || '';

  return data({
    quote,
    details,
    viewerName: viewer.accountName,
    shopifyNumericId,
  });
}

export async function action({ params, request, context }: Route.ActionArgs) {
  const viewer = await getAdminViewer(context);
  if (!viewer.ok) {
    return redirect(viewer.redirectTo);
  }

  if (!params.id) {
    return data({ ok: false, message: 'Cotización inválida' }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');
  if (intent !== 'send_quote_response') {
    return data({ ok: false, message: 'Acción inválida' }, { status: 400 });
  }

  let quoteId = params.id;
  try {
    quoteId = decodeRouteToken(params.id);
  } catch {
    try {
      quoteId = decodeURIComponent(params.id);
    } catch {
      quoteId = params.id;
    }
  }

  const quote = await findServiceQuoteRequestById(context.env, quoteId);
  if (!quote) {
    return data({ ok: false, message: 'Cotización no encontrada' }, { status: 404 });
  }

  const amount = String(formData.get('amount') || '').trim();
  const currencyCode = String(formData.get('currencyCode') || 'MXN').trim().toUpperCase();
  const message = String(formData.get('message') || '').trim();

  try {
    const response = await sendServiceQuoteResponseEmail(context.env, {
      quoteId: quote.id,
      quoteOrderId: quote.orderId,
      serviceMode: quote.serviceMode,
      customerEmail: quote.customerEmail,
      customerName: quote.customerName,
      amount,
      currencyCode,
      message,
    });

    return data({
      ok: true,
      message: `Respuesta enviada por correo usando Shopify (${response.draftOrderName || 'borrador'}).`,
      invoiceUrl: response.invoiceUrl,
    });
  } catch (error) {
    return data(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo enviar la respuesta',
      },
      { status: 500 },
    );
  }
}

export default function AdminQuoteDetailRoute() {
  const { quote, details, viewerName, shopifyNumericId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const invoiceUrl =
    actionData && 'invoiceUrl' in actionData && typeof actionData.invoiceUrl === 'string'
      ? actionData.invoiceUrl
      : '';
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const modelFiles = Array.isArray(details.modelFiles) ? details.modelFiles : [];
  const referenceFiles = Array.isArray(details.referenceFiles) ? details.referenceFiles : [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F6F6F7]">
      <AdminSidebar
        activeView="servicios-solicitudes"
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        mobileOpen={isSidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
        viewerLabel={viewerName || 'Mi perfil'}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {/* ─── Top bar (matches product/order detail) ─── */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur md:h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarMobileOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <a href="/admin?view=servicios-solicitudes" className="hover:underline">Solicitudes</a>
              <span>/</span>
              <h1 className="text-dark font-semibold truncate max-w-[200px] sm:max-w-none">{quote.orderId}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-dark">{viewerName}</p>
              <p className="text-xs text-brand-orange">Administrador</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xs">
              {viewerName[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          {/* ─── Page header ─── */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-dark">{quote.orderId}</h2>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusPillClasses(quote.status)}`}>
                {formatQuoteStatus(quote.status)}
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="ghost"
                className="flex-1 md:flex-none border-gray-200"
                type="button"
                asChild
              >
                <a href="/admin?view=servicios-solicitudes">Volver</a>
              </Button>
              {shopifyNumericId ? (
                <Button
                  variant="action"
                  className="flex-1 md:flex-none"
                  type="button"
                  asChild
                >
                  <a
                    href={`https://admin.shopify.com/store/translate3d/content/metaobjects/entries/service_quote_request/${shopifyNumericId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    Ver en Shopify Admin
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {/* ─── Quote info card ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha de solicitud</p>
                <p className="text-lg font-bold text-dark mt-0.5">{formatDateTime(quote.requestedAt)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Servicio</p>
                <p className="text-lg font-bold text-dark mt-0.5">{quote.serviceMode}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Folio</p>
                <p className="text-lg font-bold text-dark mt-0.5 font-mono">{quote.orderId}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ─── Left Column ─── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-dark">Información del cliente</h3>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cliente</p>
                    <p className="mt-1 text-sm font-bold text-dark">{quote.customerName}</p>
                    <p className="text-sm text-gray-500">{quote.customerEmail || '-'}</p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    <TagChip
                      label={formatQuoteStatus(quote.status)}
                      className={`w-fit text-xs ${statusTone(quote.status)}`}
                    />
                    <TagChip label={quote.serviceMode} className="w-fit text-xs" />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-dark">Resumen</h3>
                <p className="mt-3 text-sm text-dark/85 leading-relaxed">{quote.summary || 'Sin resumen proporcionado'}</p>
              </div>

              {/* Submitted Data */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-dark">Datos enviados</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(details)
                    .filter(([key]) => key !== 'modelFiles' && key !== 'referenceFiles')
                    .map(([key, value]) => (
                      <article key={key} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{fieldLabel(key)}</p>
                        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-sm text-dark font-sans">
                          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                        </pre>
                      </article>
                    ))}
                </div>
              </div>

              {/* Model Files */}
              {modelFiles.length > 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-dark">Archivos del modelo</h3>
                  <div className="mt-3 space-y-2">
                    {modelFiles.map((file, index) => {
                      const normalized = asRecord(file);
                      return (
                        <div key={`model-file-${index}`} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                          <div className="p-1.5 bg-brand-orange/10 rounded-lg shrink-0">
                            <ExternalLink size={14} className="text-brand-orange" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-dark truncate">{String(normalized.name || 'Archivo')}</p>
                            <p className="text-xs text-gray-400 uppercase">{String(normalized.type || '')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Reference Files */}
              {referenceFiles.length > 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-dark">Archivos de referencia</h3>
                  <div className="mt-3 space-y-2">
                    {referenceFiles.map((file, index) => {
                      const normalized = asRecord(file);
                      return (
                        <div key={`reference-file-${index}`} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                            <ExternalLink size={14} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-dark truncate">{String(normalized.name || 'Archivo')}</p>
                            <p className="text-xs text-gray-400 uppercase">{String(normalized.type || '')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* ─── Right Column (Response Form) ─── */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-dark">Responder al cliente</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Se enviará un correo desde Shopify con un borrador de cobro para esta cotización.
                </p>

                {actionData?.message ? (
                  <div
                    className={[
                      'mt-4 rounded-xl border px-4 py-3 text-sm font-semibold',
                      actionData.ok
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-red-200 bg-red-50 text-red-700',
                    ].join(' ')}
                  >
                    {actionData.message}
                    {actionData.ok && invoiceUrl ? (
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 underline underline-offset-2"
                      >
                        Ver enlace de pago
                      </a>
                    ) : null}
                  </div>
                ) : null}

                <Form method="post" className="mt-4 space-y-4">
                  <input type="hidden" name="intent" value="send_quote_response" />
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monto</label>
                    <input
                      name="amount"
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Moneda</label>
                    <input
                      name="currencyCode"
                      defaultValue="MXN"
                      maxLength={3}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all outline-none text-sm font-medium uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Mensaje adicional (opcional)
                    </label>
                    <input
                      name="message"
                      placeholder="Mensaje para el cliente"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all outline-none text-sm font-medium"
                    />
                  </div>
                  <Button type="submit" variant="action" className="w-full">
                    Enviar respuesta por correo (Shopify)
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const ADMIN_CUSTOMER_QUERY = `
  query AdminCustomer($language: LanguageCode) @inContext(language: $language) {
    customer {
      id
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
` as const;
