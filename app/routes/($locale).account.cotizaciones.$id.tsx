import { Link, data, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).account.cotizaciones.$id';
import { findServiceQuoteRequestById } from '~/lib/serviceQuotes.server';

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: `Cotización ${data?.quote?.orderId || ''}` }] as const;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatStatus(status: string) {
  const key = status.toUpperCase();
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_REVIEW: 'En revision',
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
    printType: 'Tipo de impresion',
    material: 'Material',
    color: 'Color',
    scale: 'Escala',
    sizeX: 'Tamano X',
    sizeY: 'Tamano Y',
    sizeZ: 'Tamano Z',
    instructions: 'Instrucciones',
    modelFiles: 'Archivos del modelo',
    referenceFiles: 'Archivos de referencia',
    companyName: 'Empresa',
    phoneNumber: 'Telefono',
    contactName: 'Nombre',
    contactEmail: 'Correo',
  };

  return labels[key] || key;
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  if (!params.id) {
    return redirect('/account/cotizaciones');
  }

  const { data: customerData, errors } = await context.customerAccount.query(
    SERVICE_QUOTE_CUSTOMER_QUERY,
    {
      variables: {
        language: context.customerAccount.i18n.language,
      },
    },
  );

  if (errors?.length || !customerData?.customer?.id) {
    throw new Response('No se pudo obtener el cliente', { status: 400 });
  }

  let quoteId = '';
  try {
    quoteId = atob(decodeURIComponent(params.id));
  } catch {
    throw new Response('Folio inválido', { status: 400 });
  }

  const quote = await findServiceQuoteRequestById(context.env, quoteId, {
    customerId: customerData.customer.id,
  });

  if (!quote) {
    throw new Response('Cotización no encontrada', { status: 404 });
  }

  let details: Record<string, unknown> = {};
  try {
    details = asRecord(JSON.parse(quote.detailsJson || '{}'));
  } catch {
    details = {};
  }

  return data({ quote, details });
}

export default function QuoteDetailRoute() {
  const { quote, details } = useLoaderData<typeof loader>();
  const modelFiles = Array.isArray(details.modelFiles) ? details.modelFiles : [];
  const referenceFiles = Array.isArray(details.referenceFiles) ? details.referenceFiles : [];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-dark/10 bg-white p-6">
        <div className="flex items-center justify-between">
          <Link
            to="/account/cotizaciones"
            className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary hover:text-dark"
          >
            ← Volver a cotizaciones
          </Link>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-tgray">Folio: {quote.orderId}</p>
        </div>
        <h2 className="mt-4 text-3xl font-extrabold uppercase tracking-tight text-dark">{quote.serviceMode}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-tight bg-primary/10 text-primary border-primary/20`}>
            {formatStatus(quote.status)}
          </span>
          <p className="text-sm text-dark/70">Enviada el {formatDate(quote.requestedAt)}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-dark/10 bg-white p-6">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-tgray">Resumen</h3>
        <p className="mt-3 text-sm text-dark/85">{quote.summary || 'Sin resumen'}</p>
      </section>

      <section className="rounded-2xl border border-dark/10 bg-white p-6">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-tgray">Datos enviados</h3>
        <div className="mt-4 space-y-3">
          {Object.entries(details).length === 0 ? (
            <p className="text-sm text-dark/70">No hay detalles registrados.</p>
          ) : (
            Object.entries(details)
              .filter(([key]) => key !== 'modelFiles' && key !== 'referenceFiles')
              .map(([key, value]) => (
                <article key={key} className="rounded-lg border border-dark/10 bg-light p-3">
                  <p className="text-xs font-extrabold uppercase tracking-tight text-tgray">{fieldLabel(key)}</p>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-sm text-dark">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </pre>
                </article>
              ))
          )}
        </div>
      </section>

      {modelFiles.length > 0 ? (
        <section className="rounded-2xl border border-dark/10 bg-white p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-tgray">Archivos del modelo</h3>
          <div className="mt-4 space-y-2">
            {modelFiles.map((file, index) => {
              const normalized = asRecord(file);
              return (
                <div key={`model-file-${index}`} className="rounded border border-dark/10 bg-light px-3 py-2">
                  <p className="text-sm font-semibold text-dark">{String(normalized.name || 'Archivo')}</p>
                  <p className="text-xs uppercase text-tgray">{String(normalized.type || '')}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {referenceFiles.length > 0 ? (
        <section className="rounded-2xl border border-dark/10 bg-white p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-tgray">
            Archivos de referencia
          </h3>
          <div className="mt-4 space-y-2">
            {referenceFiles.map((file, index) => {
              const normalized = asRecord(file);
              return (
                <div key={`ref-file-${index}`} className="rounded border border-dark/10 bg-light px-3 py-2">
                  <p className="text-sm font-semibold text-dark">{String(normalized.name || 'Archivo')}</p>
                  <p className="text-xs uppercase text-tgray">{String(normalized.type || '')}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

const SERVICE_QUOTE_CUSTOMER_QUERY = `
  query ServiceQuoteCustomerForAccountDetail($language: LanguageCode) @inContext(language: $language) {
    customer {
      id
    }
  }
` as const;
