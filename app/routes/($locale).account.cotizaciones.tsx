import { data, Link, Outlet, redirect, useLoaderData, useLocation, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import type { Route } from './+types/($locale).account.cotizaciones';
import { listServiceQuoteRequests, type ServiceQuoteRecord } from '~/lib/serviceQuotes.server';
import { AccountSectionLayout } from '~/components/account/AccountSectionLayout';
import { TagChip } from '~/components/landing/TagChip';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

type QuoteSort = 'fecha_desc' | 'fecha_asc' | 'estado' | 'servicio';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Mis cotizaciones' }];
};

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const isLoggedIn = await context.customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return redirect('/account/login');
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
      throw new Error('No se pudo obtener el cliente');
    }

    const quotes = await listServiceQuoteRequests(context.env, {
      customerId: customerData.customer.id,
      first: 100,
    });

    return data({ quotes, loadError: null as string | null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    const authLikeError =
      /token|unauth|authoriz|login|session|credential|forbidden|401|403/i.test(message);

    if (authLikeError) {
      return redirect('/account/login');
    }

    return data({
      quotes: [] as ServiceQuoteRecord[],
      loadError: 'No fue posible cargar tus cotizaciones en este momento.',
    });
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatStatus(status: string) {
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

function statusTone(status: string) {
  const key = status.toUpperCase();
  if (key === 'APPROVED' || key === 'COMPLETED') return 'bg-green-50 text-green-700 border-green-200';
  if (key === 'REJECTED' || key === 'CANCELED') return 'bg-red-50 text-red-700 border-red-200';
  if (key === 'IN_REVIEW') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-light text-dark border-dark/15';
}

function normalizeSort(value: string): QuoteSort {
  if (value === 'fecha_asc' || value === 'estado' || value === 'servicio') return value;
  return 'fecha_desc';
}

function sortLabel(sort: QuoteSort) {
  switch (sort) {
    case 'fecha_asc':
      return 'Fecha: antigua → reciente';
    case 'estado':
      return 'Estado';
    case 'servicio':
      return 'Servicio';
    case 'fecha_desc':
    default:
      return 'Fecha: reciente → antigua';
  }
}

function normalizeQuote(raw: ServiceQuoteRecord): ServiceQuoteRecord {
  return {
    ...raw,
    orderId: String(raw.orderId || 'N/A'),
    serviceMode: (raw.serviceMode ? String(raw.serviceMode) : 'impresion') as ServiceQuoteRecord['serviceMode'],
    status: String(raw.status || 'PENDING'),
    summary: String(raw.summary || ''),
    requestedAt: String(raw.requestedAt || raw.updatedAt || new Date().toISOString()),
  };
}

export default function AccountQuotesRoute() {
  const { quotes, loadError } = useLoaderData<typeof loader>();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<QuoteSort>('fecha_desc');
  const location = useLocation();
  const navigate = useNavigate();

  const filteredQuotes = useMemo(() => {
    const search = q.trim().toLowerCase();
    const hasSearch = search.length > 0;

    const rows = quotes.map(normalizeQuote).filter((quote) => {
      if (!hasSearch) return true;
      return (
        quote.orderId.toLowerCase().includes(search) ||
        quote.serviceMode.toLowerCase().includes(search) ||
        quote.status.toLowerCase().includes(search) ||
        (quote.summary || '').toLowerCase().includes(search)
      );
    });

    rows.sort((a, b) => {
      if (sort === 'fecha_asc') {
        return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      }

      if (sort === 'estado') {
        return formatStatus(a.status).localeCompare(formatStatus(b.status), 'es');
      }

      if (sort === 'servicio') {
        return a.serviceMode.localeCompare(b.serviceMode, 'es');
      }

      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });

    return rows;
  }, [quotes, q, sort]);

  const isDetailRoute = /\/account\/cotizaciones\/[^/]+$/.test(location.pathname);

  if (isDetailRoute) return <Outlet />;

  const pendingCount = filteredQuotes.filter((quote) => quote.status.toUpperCase() === 'PENDING').length;

  return (
    <AccountSectionLayout
      title="Mis cotizaciones"
      subtitle="Filtra tus solicitudes y abre el detalle completo de cada folio."
      actions={
        <>
          <TagChip label={`${filteredQuotes.length} resultados`} />
          <TagChip label={`${pendingCount} pendientes`} />
        </>
      }
    >
      <div className="rounded-xl border border-dark/10 bg-light p-4">
        <fieldset className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por folio, servicio, estado o resumen"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="default"
                className="h-10 px-4 flex items-center bg-light border border-dark rounded-md text-xs font-bold uppercase lg:col-span-3"
              >
                Orden: {sortLabel(sort)}
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[230px]">
              <DropdownMenuItem onSelect={() => setSort('fecha_desc')}>Fecha: reciente → antigua</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort('fecha_asc')}>Fecha: antigua → reciente</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort('estado')}>Estado</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort('servicio')}>Servicio</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10 border border-dark bg-white text-xs font-bold uppercase lg:col-span-3"
            onClick={() => {
              setQ('');
              setSort('fecha_desc');
            }}
          >
            Limpiar
          </Button>
        </fieldset>
      </div>

      {loadError ? (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-dark">
          {loadError}
        </div>
      ) : null}

      {filteredQuotes.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dark/10 bg-light p-4">
          <p className="text-sm text-dark/80">No encontramos cotizaciones con esos filtros.</p>
          <Link to="/servicios" className="mt-2 inline-flex text-sm font-extrabold uppercase text-primary hover:text-dark">
            Crear una solicitud
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-dark/10">
          <table className="min-w-[880px] w-full text-left">
            <thead className="bg-lightgray text-xs font-extrabold uppercase tracking-tight text-tgray">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Resumen</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const href = `/account/cotizaciones/${encodeURIComponent(btoa(quote.id))}`;
                return (
                  <tr
                    key={quote.id}
                    className="cursor-pointer border-t border-dark/10 bg-white hover:bg-primary/5"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(href)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(href);
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-bold uppercase text-dark">
                      <Link to={href} className="underline underline-offset-2 hover:text-primary">
                        {quote.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold uppercase text-dark">{quote.serviceMode}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-tight ${statusTone(quote.status)}`}
                      >
                        {formatStatus(quote.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark/80">
                      {(quote.summary || 'Sin resumen').slice(0, 120)}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark/75">{formatDate(quote.requestedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AccountSectionLayout>
  );
}

const SERVICE_QUOTE_CUSTOMER_QUERY = `
  query ServiceQuoteCustomerForAccount($language: LanguageCode) @inContext(language: $language) {
    customer {
      id
    }
  }
` as const;
