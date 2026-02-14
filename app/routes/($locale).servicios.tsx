import {Suspense, useEffect, useState} from 'react';
import type { ChangeEvent } from 'react';
import {
  Await,
  Form,
  Link,
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type { Route } from './+types/($locale).servicios';
import { Button } from '~/components/ui/button';
import {BestSellers, type BestSellerProduct} from '~/components/landing/BestSellers';
import {SectionSeparator} from '~/components/SectionSeparator';
import {
  createServiceQuoteRequest,
  generateQuoteOrderId,
} from '~/lib/serviceQuotes.server';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Translate3D | Servicios' }];
};

type ServiceMode = 'modelado' | 'impresion';

type UploadItem = {
  id: string;
  name: string;
  size: number;
};

type CustomerContext = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
};

type ActionResponse = {
  ok?: boolean;
  mode?: ServiceMode;
  orderId?: string;
  error?: string;
  requiresLogin?: boolean;
};

const SERVICE_MODE_CARDS: Record<
  ServiceMode,
  { title: string; subtitle: string; image: string }
> = {
  modelado: {
    title: 'Dise\u00f1o y modelaje',
    subtitle: 'en AutoCAD',
    image: '/design.webp',
  },
  impresion: {
    title: 'Impresion de modelos',
    subtitle: 'personalizados',
    image: '/work.webp',
  },
};

function formatBytes(size: number) {
  if (!size || Number.isNaN(size)) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function buildUploadItems(files: FileList | null) {
  if (!files) return [];
  return Array.from(files)
    .filter((file) => file.size > 0)
    .map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
    }));
}

function parseFiles(input: FormDataEntryValue[]) {
  return input
    .filter((entry): entry is File => typeof entry !== 'string')
    .filter((file) => file.size > 0)
    .map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    }));
}

async function getLoggedInCustomer(
  context: Route.LoaderArgs['context'] | Route.ActionArgs['context'],
): Promise<CustomerContext | null> {
  const isLoggedIn = await context.customerAccount.isLoggedIn();

  if (!isLoggedIn) {
    return null;
  }

  const { data: customerData, errors } = await context.customerAccount.query(
    SERVICE_QUOTE_CUSTOMER_QUERY,
    {
      variables: {
        language: context.customerAccount.i18n.language,
      },
    },
  );

  if (errors?.length || !customerData?.customer) {
    return null;
  }

  return {
    id: customerData.customer.id,
    firstName: customerData.customer.firstName,
    lastName: customerData.customer.lastName,
    email: customerData.customer.emailAddress?.emailAddress || '',
  };
}

function normalizeMode(value: string | null): ServiceMode {
  return value === 'modelado' ? 'modelado' : 'impresion';
}

function customerDisplayName(customer: CustomerContext, fallback?: string) {
  const preferred = (fallback || '').trim();
  if (preferred) return preferred;

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
  return fullName || 'Cliente';
}

function customerEmail(customer: CustomerContext, fallback?: string) {
  const preferred = (fallback || '').trim();
  if (preferred) return preferred;
  return (customer.email || '').trim();
}

function resolveOtherValue(selected: string, other: FormDataEntryValue | null) {
  if (selected !== 'otros') return selected;
  return String(other || '').trim() || selected;
}

export async function loader({ context }: Route.LoaderArgs) {
  const customer = await getLoggedInCustomer(context);
  const bestSellers = context.storefront
    .query(SERVICES_BEST_SELLERS_QUERY, {
      variables: {first: 12},
      cache: context.storefront.CacheShort(),
    })
    .then((res) => res.products.nodes as unknown as BestSellerProduct[])
    .catch((error: Error) => {
      console.error(error);
      return [] as BestSellerProduct[];
    });

  return {
    isLoggedIn: Boolean(customer),
    customer,
    bestSellers,
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const mode = normalizeMode(String(formData.get('mode') || 'impresion'));

  const customer = await getLoggedInCustomer(context);

  if (!customer) {
    return data<ActionResponse>(
      {
        error: 'Debes iniciar sesion para enviar una solicitud de cotizacion.',
        requiresLogin: true,
        mode,
      },
      { status: 401 },
    );
  }

  const submittedName = String(formData.get('contactName') || '');
  const submittedEmail = String(formData.get('contactEmail') || '');
  const instructions = String(formData.get('instructions') || '').trim();

  const resolvedName = customerDisplayName(customer, submittedName);
  const resolvedEmail = customerEmail(customer, submittedEmail);

  if (!resolvedEmail) {
    return data<ActionResponse>(
      {
        error: 'No encontramos un correo para tu cuenta. Actualiza tu perfil antes de enviar la solicitud.',
        mode,
      },
      { status: 400 },
    );
  }

  if (!instructions) {
    return data<ActionResponse>(
      {
        error: 'Agrega instrucciones para que podamos cotizar correctamente.',
        mode,
      },
      { status: 400 },
    );
  }

  const orderId = generateQuoteOrderId();

  const modelFiles = parseFiles(formData.getAll('modelFiles'));
  const referenceFiles = parseFiles(formData.getAll('referenceFiles'));
  const selectedPrintType = String(formData.get('printType') || '').trim();
  const selectedMaterial = String(formData.get('material') || '').trim();
  const selectedColor = String(formData.get('color') || '').trim();

  const details =
    mode === 'impresion'
      ? {
        mode,
        printType: resolveOtherValue(selectedPrintType, formData.get('printTypeOther')),
        material: resolveOtherValue(selectedMaterial, formData.get('materialOther')),
        color: resolveOtherValue(selectedColor, formData.get('colorOther')),
        scale: String(formData.get('scale') || ''),
        sizeX: String(formData.get('sizeX') || ''),
        sizeY: String(formData.get('sizeY') || ''),
        sizeZ: String(formData.get('sizeZ') || ''),
        instructions,
        modelFiles,
        contactName: resolvedName,
        contactEmail: resolvedEmail,
      }
      : {
        mode,
        companyName: String(formData.get('companyName') || ''),
        phoneNumber: String(formData.get('phoneNumber') || ''),
        instructions,
        referenceFiles,
        contactName: resolvedName,
        contactEmail: resolvedEmail,
      };

  const summary =
    mode === 'impresion'
      ? `Cotizacion de impresion 3D solicitada por ${resolvedName}.`
      : `Cotizacion de diseno/modelado CAD solicitada por ${resolvedName}.`;

  try {
    const createdQuoteId = await createServiceQuoteRequest(context.env, {
      orderId,
      customerId: customer.id,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      serviceMode: mode,
      summary,
      details,
    });

    const localePrefix = params.locale ? `/${params.locale}` : '';
    const quoteRef = btoa(createdQuoteId);
    return redirect(`${localePrefix}/account/cotizaciones/${encodeURIComponent(quoteRef)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar la solicitud.';

    return data<ActionResponse>(
      {
        error: message,
        mode,
      },
      { status: 500 },
    );
  }
}

function ModeCard({
  mode,
  activeMode,
  onSelect,
}: {
  mode: ServiceMode;
  activeMode: ServiceMode;
  onSelect: (mode: ServiceMode) => void;
}) {
  const config = SERVICE_MODE_CARDS[mode];
  const isActive = activeMode === mode;

  return (
    <article className="relative flex min-h-[260px] flex-1 overflow-hidden rounded border border-dark/10">
      <img
        src={config.image}
        alt={`${config.title} ${config.subtitle}`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/30 to-dark/40" />

      <div className="relative z-10 flex w-full flex-col justify-between p-5 md:p-6">
        <h3 className="font-manrope text-[clamp(1.7rem,3vw,2.3rem)] font-extrabold uppercase leading-[0.95] text-light">
          {config.title}
          <br />
          {config.subtitle}
        </h3>

        <Button
          type="button"
          variant={isActive ? 'primary' : 'action'}
          className="w-full justify-center"
          onClick={() => onSelect(mode)}
          selected={isActive}
        >
          {isActive ? 'Seleccionado' : 'Seleccionar'}
        </Button>
      </div>
    </article>
  );
}

function InputLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[11px] font-extrabold uppercase tracking-tight text-dark/75">
      {children}
      {required ? <span className="text-primary"> *</span> : null}
    </label>
  );
}

function UploadList({
  files,
  onRemove,
}: {
  files: UploadItem[];
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="mt-3 flex w-full flex-col gap-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex w-full items-center justify-between rounded border border-dark/30 px-3 py-2"
        >
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-xs font-bold uppercase tracking-tight text-dark">{file.name}</p>
            <p className="text-[11px] font-semibold uppercase text-tgray">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="ml-4 rounded border border-primary px-2 py-1 text-[10px] font-extrabold uppercase text-primary hover:bg-primary hover:text-light"
          >
            Quitar
          </button>
        </div>
      ))}
    </div>
  );
}

function BaseInput({
  name,
  placeholder,
  type = 'text',
  defaultValue,
  required,
}: {
  name: string;
  placeholder: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full rounded border border-dark/25 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}

function LoginRequired({ currentMode }: { currentMode: ServiceMode }) {
  return (
    <div className="rounded border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-semibold text-dark">
        Debes iniciar sesion para enviar tu solicitud de cotizacion.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="action">
          <Link to="/account/login" prefetch="intent">
            Iniciar sesion
          </Link>
        </Button>
        <p className="self-center text-xs font-semibold uppercase text-tgray">
          Servicio seleccionado: {currentMode}
        </p>
      </div>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <div className="rounded border border-dark/20 bg-light px-4 py-3 text-sm text-tgray">
      <div className="inline-flex items-center gap-2">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 text-tgray"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
        <span className="font-semibold">Tu privacidad es nuestra prioridad.</span>
      </div>
      <p className="mt-1 text-xs">
        Tus archivos son confidenciales y se usan unicamente para cotizar y producir tu solicitud.
      </p>
    </div>
  );
}

export default function ServiciosRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [searchParams] = useSearchParams();
  const requestedTab = normalizeMode(searchParams.get('tab'));

  const [activeMode, setActiveMode] = useState<ServiceMode>(requestedTab);
  const [printUpload, setPrintUpload] = useState<UploadItem[]>([]);
  const [autocadUploads, setAutocadUploads] = useState<UploadItem[]>([]);
  const [printType, setPrintType] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    setActiveMode(requestedTab);
  }, [requestedTab]);

  const handleModeSelect = (mode: ServiceMode) => {
    setActiveMode(mode);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', mode);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const onPrintUpload = (event: ChangeEvent<HTMLInputElement>) => {
    setPrintUpload(buildUploadItems(event.target.files));
  };

  const onAutocadUpload = (event: ChangeEvent<HTMLInputElement>) => {
    setAutocadUploads(buildUploadItems(event.target.files));
  };

  const isSubmitting = navigation.state === 'submitting';
  const customerName =
    [loaderData.customer?.firstName, loaderData.customer?.lastName].filter(Boolean).join(' ').trim() || '';
  const customerEmail = loaderData.customer?.email || '';

  return (
    <div className="flex w-full flex-col bg-[#f4f4f4] pt-16 text-dark md:pt-20">
      <section
        className="relative min-h-[480px] overflow-hidden border-b border-dark/10"
        style={{ backgroundImage: 'url(/design.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-dark/55" />
        <div className="relative mx-auto flex w-full max-w-[1920px] flex-col justify-between gap-10 px-5 py-12 md:px-10 lg:min-h-[480px] lg:px-12">
          <h1 className="max-w-3xl font-manrope text-[clamp(3rem,9vw,5.5rem)] font-extrabold uppercase leading-[0.9] text-light">
            Cotiza tu diseño CAD
          </h1>
          <div className="self-end text-right">
            <p className="max-w-md text-sm font-extrabold uppercase leading-5 tracking-tight text-light md:text-base">
              Realiza tus proyectos CAD con nosotros. Nuestro equipo ofrece modelado 3D, conversiones y mas.
              Llena el formulario a continuacion y nos pondremos en contacto contigo de inmediato.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1920px] flex-col gap-8 px-5 py-10 md:px-10 lg:px-12">
        <h2 className="text-center font-manrope text-[clamp(2rem,5vw,4rem)] font-extrabold uppercase leading-[0.92] text-dark">
          Selecciona tu area de interes
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <ModeCard mode="modelado" activeMode={activeMode} onSelect={handleModeSelect} />
          <ModeCard mode="impresion" activeMode={activeMode} onSelect={handleModeSelect} />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1920px] px-5 py-12 md:px-10 lg:px-12">
        {activeMode === 'impresion' ? (
          <Form method="post" encType="multipart/form-data" className="grid w-full gap-10 xl:grid-cols-[minmax(0,1fr)_520px]">
            <input type="hidden" name="mode" value="impresion" />

            <div className="flex flex-col gap-5">
              <h3 className="font-manrope text-[clamp(2rem,4vw,3.5rem)] font-extrabold uppercase leading-[0.92] text-dark">
                Impresion de modelos personalizados
              </h3>

              <label className="group flex min-h-[76px] cursor-pointer items-center justify-center rounded border border-dashed border-dark/25 bg-light px-4 py-3 text-center hover:border-primary/60">
                <input
                  type="file"
                  name="modelFiles"
                  accept=".stl,.obj,.3mf,.step,.stp,.iges,.igs,.dwg,.dxf,.pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.doc,.docx,.txt,.rtf,.zip"
                  multiple
                  className="hidden"
                  onChange={onPrintUpload}
                />
                <span className="font-manrope text-xs font-semibold uppercase text-tgray">
                  Adjunta modelo o referencias (imagenes, PDF, documentos, CAD o STL)
                </span>
              </label>

              <UploadList
                files={printUpload}
                onRemove={(id) => setPrintUpload((current) => current.filter((file) => file.id !== id))}
              />

              <PrivacyNotice />
            </div>

            <div className="flex flex-col gap-5">
              <p className="text-sm font-medium leading-relaxed text-dark/80">
                Personaliza los parametros de impresion para recibir una cotizacion precisa.
              </p>

              <div className="space-y-2">
                <InputLabel required>Nombre</InputLabel>
                <BaseInput
                  name="contactName"
                  placeholder="Nombre completo"
                  defaultValue={customerName}
                  required
                />

                <InputLabel required>Correo electronico</InputLabel>
                <BaseInput
                  name="contactEmail"
                  placeholder="correo@empresa.com"
                  defaultValue={customerEmail}
                  type="email"
                  required
                />

                <InputLabel>Tipo de impresion</InputLabel>
                <select
                  name="printType"
                  value={printType}
                  onChange={(event) => setPrintType(event.target.value)}
                  className="w-full rounded border border-dark/25 bg-light px-4 py-3 text-sm font-semibold uppercase text-dark"
                >
                  <option value="">Selecciona una opcion</option>
                  <option>FDM</option>
                  <option>SLA</option>
                  <option value="otros">Otros (especificar)</option>
                </select>
                {printType === 'otros' ? (
                  <BaseInput name="printTypeOther" placeholder="Especifica el tipo de impresion" />
                ) : null}

                <InputLabel>Material</InputLabel>
                <select
                  name="material"
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  className="w-full rounded border border-dark/25 bg-light px-4 py-3 text-sm font-semibold uppercase text-dark"
                >
                  <option value="">Selecciona una opcion</option>
                  <option>PLA</option>
                  <option>ABS</option>
                  <option>Resina estandar</option>
                  <option value="otros">Otros (especificar)</option>
                </select>
                {material === 'otros' ? (
                  <BaseInput name="materialOther" placeholder="Especifica el material" />
                ) : null}

                <InputLabel>Color</InputLabel>
                <select
                  name="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="w-full rounded border border-dark/25 bg-light px-4 py-3 text-sm font-semibold uppercase text-dark"
                >
                  <option value="">Selecciona una opcion</option>
                  <option>Negro</option>
                  <option>Blanco</option>
                  <option>Rojo</option>
                  <option value="otros">Otros (especificar)</option>
                </select>
                {color === 'otros' ? (
                  <BaseInput name="colorOther" placeholder="Especifica el color" />
                ) : null}

                <InputLabel>Escala</InputLabel>
                <BaseInput name="scale" placeholder="100%" />

                <InputLabel>Tamano (mm)</InputLabel>
                <div className="grid grid-cols-3 gap-2">
                  <BaseInput name="sizeX" placeholder="Ancho" type="number" />
                  <BaseInput name="sizeY" placeholder="Alto" type="number" />
                  <BaseInput name="sizeZ" placeholder="Largo" type="number" />
                </div>

                <InputLabel required>Instrucciones personalizadas</InputLabel>
                <textarea
                  rows={7}
                  name="instructions"
                  required
                  placeholder="Ej: lijado, pintado, cuidado extra en envio, etc."
                  className="w-full rounded border border-dark/25 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {loaderData.isLoggedIn ? (
                <Button type="submit" variant="action" className="w-full justify-center py-3" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud de cotizacion'}
                </Button>
              ) : (
                <LoginRequired currentMode="impresion" />
              )}
            </div>
          </Form>
        ) : (
          <Form method="post" encType="multipart/form-data" className="grid w-full gap-10 xl:grid-cols-[minmax(0,1fr)_520px]">
            <input type="hidden" name="mode" value="modelado" />

            <div className="flex flex-col gap-6">
              <h3 className="font-manrope text-[clamp(2rem,4vw,3.5rem)] font-extrabold uppercase leading-[0.92] text-dark">
                Diseño y modelaje en AutoCAD
              </h3>

              <label className="group flex min-h-[76px] cursor-pointer items-center justify-center rounded border border-dashed border-dark/25 bg-light px-4 py-3 text-center hover:border-primary/60">
                <input
                  type="file"
                  name="referenceFiles"
                  className="hidden"
                  multiple
                  onChange={onAutocadUpload}
                  accept=".dwg,.dxf,.step,.stl,.obj,.png,.jpg,.jpeg,.mp4"
                />
                <span className="font-manrope text-xs font-semibold uppercase text-tgray">
                  Adjunta tus archivos (max. 5 archivos de 50MB)
                </span>
              </label>

              <UploadList
                files={autocadUploads}
                onRemove={(id) => setAutocadUploads((current) => current.filter((file) => file.id !== id))}
              />

              <PrivacyNotice />
            </div>

            <div className="flex flex-col gap-5">
              <h4 className="font-manrope text-3xl font-extrabold uppercase leading-[0.95] text-dark">
                Solicitud de modelado CAD
              </h4>
              <p className="text-sm font-medium leading-relaxed text-dark/80">
                Completa los campos y agrega referencias para definir alcance, tiempos y costos.
              </p>

              <div className="space-y-3">
                <div>
                  <InputLabel required>Tu nombre</InputLabel>
                  <BaseInput
                    name="contactName"
                    placeholder="Nombre completo"
                    defaultValue={customerName}
                    required
                  />
                </div>
                <div>
                  <InputLabel>Nombre de tu empresa</InputLabel>
                  <BaseInput name="companyName" placeholder="Empresa (opcional)" />
                </div>
                <div>
                  <InputLabel required>Correo electronico</InputLabel>
                  <BaseInput
                    name="contactEmail"
                    placeholder="correo@empresa.com"
                    defaultValue={customerEmail}
                    type="email"
                    required
                  />
                </div>
                <div>
                  <InputLabel>Telefono</InputLabel>
                  <BaseInput name="phoneNumber" placeholder="+52 ..." type="tel" />
                </div>
                <div>
                  <InputLabel required>Instrucciones personalizadas</InputLabel>
                  <textarea
                    rows={8}
                    name="instructions"
                    required
                    placeholder="Dimensiones, usos, referencias, acabados, requerimientos de entrega..."
                    className="w-full rounded border border-dark/25 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <p className="text-sm text-tgray">
                <span className="text-primary">*</span> Indica un campo obligatorio
              </p>

              {loaderData.isLoggedIn ? (
                <Button type="submit" variant="action" className="w-full justify-center py-3" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud de cotizacion'}
                </Button>
              ) : (
                <LoginRequired currentMode="modelado" />
              )}
            </div>
          </Form>
        )}
      </section>

      <SectionSeparator />

      <Suspense
        fallback={
          <section className="flex w-full items-center justify-center bg-light py-20 text-dark">
            <p className="text-sm font-semibold uppercase text-tgray">Cargando productos...</p>
          </section>
        }
      >
        <Await resolve={loaderData.bestSellers}>
          {(products) => <BestSellers products={products} />}
        </Await>
      </Suspense>

      <section className="mx-auto mb-10 w-full max-w-[1920px] px-5 md:px-10 lg:px-12">
        {actionData?.ok && actionData.orderId ? (
          <div className="rounded border border-green-600/40 bg-green-50 p-4 text-green-800">
            <p className="text-sm font-semibold">Solicitud enviada correctamente.</p>
            <p className="mt-1 text-sm font-bold uppercase tracking-tight">Folio: {actionData.orderId}</p>
            <p className="mt-1 text-xs">
              Puedes revisar el estado en <Link to="/account/cotizaciones" className="font-bold underline">tu cuenta</Link>.
            </p>
          </div>
        ) : null}

        {actionData?.error ? (
          <div className="rounded border border-primary/40 bg-primary/10 p-4 text-dark">
            <p className="text-sm font-semibold">{actionData.error}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const SERVICE_QUOTE_CUSTOMER_QUERY = `
  query ServiceQuoteCustomer($language: LanguageCode) @inContext(language: $language) {
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

const SERVICES_BEST_SELLERS_QUERY = `#graphql
  fragment ServicesLandingProduct on Product {
    id
    title
    handle
    tags
    collections(first: 10) {
      nodes {
        handle
        title
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }

  query ServicesBestSellers(
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        ...ServicesLandingProduct
      }
    }
  }
` as const;
