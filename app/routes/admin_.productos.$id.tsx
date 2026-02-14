import { Form, data, redirect, useActionData, useLoaderData } from 'react-router';
import type { Route } from './+types/admin_.productos.$id';
import { AdminSidebar } from '~/components/admin/AdminSidebar';
import { Button } from '~/components/ui/button';
import { Menu, Lock, Unlock, ChevronDown, Check, AlertCircle, Loader2, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigation } from 'react-router';
import { getAdminProductDetails, isAdminCustomer, updateAdminProduct } from '~/lib/shopifyAdmin.server';
import { decodeRouteToken } from '~/lib/urlTokens';
import { TipTapEditor } from '~/components/admin/TipTapEditor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

const TIENDA_VIEWS = new Set(['tienda-modelos-3d', 'tienda-filamentos', 'tienda-resinas', 'tienda-refacciones']);

function normalizeTiendaView(view: string | null) {
  if (view && TIENDA_VIEWS.has(view)) return view;
  return 'tienda-modelos-3d';
}

/**
 * Extracts the numeric ID from a Shopify GID.
 * e.g. "gid://shopify/Product/7792022388801" → "7792022388801"
 */
function extractNumericId(gid: string): string {
  const match = gid.match(/\/(\d+)$/);
  return match ? match[1] : gid;
}

async function getAdminViewer(context: Route.LoaderArgs['context'] | Route.ActionArgs['context']) {
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

function decodeEntityId(raw: string) {
  try {
    return decodeRouteToken(raw);
  } catch {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const viewer = await getAdminViewer(context);
  if (!viewer.ok) {
    return redirect(viewer.redirectTo);
  }

  if (!params.id) {
    return redirect('/admin?view=tienda-modelos-3d');
  }

  const url = new URL(request.url);
  const activeView = normalizeTiendaView(url.searchParams.get('view'));
  const productId = decodeEntityId(params.id);

  const product = await getAdminProductDetails(context.env, productId);
  if (!product) {
    throw new Response('Producto no encontrado', { status: 404 });
  }

  return data({
    product,
    activeView,
    viewerName: viewer.accountName,
    shopifyNumericId: extractNumericId(product.id),
  });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const viewer = await getAdminViewer(context);
  if (!viewer.ok) {
    return redirect(viewer.redirectTo);
  }

  if (!params.id) {
    return data({ ok: false, message: 'Producto invalido' }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');
  if (intent !== 'update_product') {
    return data({ ok: false, message: 'Accion invalida' }, { status: 400 });
  }

  const productId = decodeEntityId(params.id);
  const tags = String(formData.get('tags') || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  try {
    await updateAdminProduct(context.env, {
      productId,
      title: String(formData.get('title') || '').trim(),
      handle: String(formData.get('handle') || '').trim() || undefined,
      descriptionHtml: String(formData.get('descriptionHtml') || ''),
      vendor: String(formData.get('vendor') || ''),
      productType: String(formData.get('productType') || ''),
      status: String(formData.get('status') || 'DRAFT'),
      tags,
      variantId: String(formData.get('variantId') || '').trim() || undefined,
      variantPrice: String(formData.get('variantPrice') || '').trim() || undefined,
      variantCompareAtPrice: String(formData.get('variantCompareAtPrice') || '').trim() || undefined,
    });

    return data({ ok: true, message: 'Producto actualizado correctamente.' });
  } catch (error) {
    return data(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo actualizar el producto.',
      },
      { status: 500 },
    );
  }
}

export default function AdminProductDetailRoute() {
  const { product, activeView, viewerName, shopifyNumericId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const primaryVariant = product.variants[0];

  const [title, setTitle] = useState(product.title);
  const [handle, setHandle] = useState(product.handle);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>(product.status as any);
  const [descriptionHtml, setDescriptionHtml] = useState(product.descriptionHtml);
  const [vendor, setVendor] = useState(product.vendor);
  const [productType, setProductType] = useState(product.productType);
  const [tags, setTags] = useState<string[]>(product.tags);
  const [tagInput, setTagInput] = useState('');
  const [price, setPrice] = useState(primaryVariant?.price || '');
  const [compareAtPrice, setCompareAtPrice] = useState(primaryVariant?.compareAtPrice || '');

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const isSubmitting = navigation.state === 'submitting' || navigation.state === 'loading';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F6F6F7]">
      <AdminSidebar
        activeView={activeView}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={isSidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
        viewerLabel={viewerName || 'Mi perfil'}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur md:h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarMobileOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <a href={`/admin?view=${activeView}`} className="hover:underline">Productos</a>
              <span>/</span>
              <h1 className="text-dark font-semibold truncate max-w-[200px] sm:max-w-none">{product.title}</h1>
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
          <Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value="update_product" />
            <input type="hidden" name="variantId" value={primaryVariant?.id || ''} />
            <input type="hidden" name="descriptionHtml" value={descriptionHtml} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="tags" value={tags.join(',')} />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-dark">{title || product.title}</h2>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                  status === 'ARCHIVED' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                  {status === 'ACTIVE' ? 'Activo' : status === 'ARCHIVED' ? 'Archivado' : 'Borrador'}
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                  variant="ghost"
                  className="flex-1 md:flex-none border-gray-200"
                  type="button"
                  asChild
                >
                  <a href={`/admin?view=${activeView}`}>Volver</a>
                </Button>
                {product.onlineStoreUrl && (
                  <Button
                    variant="ghost"
                    className="flex-1 md:flex-none"
                    type="button"
                    asChild
                  >
                    <a href={product.onlineStoreUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} className="mr-1.5" />
                      Ver público
                    </a>
                  </Button>
                )}
                <Button
                  variant="action"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </Button>
              </div>
            </div>

            {actionData?.message && (
              <div className={`p-4 border rounded-xl flex items-start gap-3 ${actionData.ok
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                {actionData.ok ? (
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium">{actionData.message}</p>
              </div>
            )}

            {/* Shopify Admin link */}
            <a
              href={`https://admin.shopify.com/store/translate3d/products/${shopifyNumericId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#004C3F]/5 border border-[#004C3F]/15 rounded-xl hover:bg-[#004C3F]/10 transition-colors group"
            >
              <div className="p-2 bg-[#004C3F] rounded-lg shrink-0">
                <ExternalLink size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-dark">Editar en Shopify Admin</p>
                <p className="text-xs text-gray-500 mt-0.5">Gestiona imágenes, inventario, variantes y más detalles avanzados.</p>
              </div>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-[#004C3F] transition-colors shrink-0" />
            </a>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-dark flex items-center gap-1">
                      Nombre del producto <span className="text-brand-orange">*</span>
                    </label>
                    <input
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Torre Eiffel - Miniatura 3D"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all outline-none text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-dark">
                      Descripción
                    </label>
                    <TipTapEditor
                      content={descriptionHtml}
                      onChange={setDescriptionHtml}
                      placeholder="Describe las características, materiales y dimensiones del producto..."
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-dark uppercase tracking-tight">Precios</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-dark flex items-center gap-1">
                        Precio de venta <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          name="variantPrice"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-11 pl-8 pr-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all outline-none text-sm font-medium"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-dark">
                        Precio de comparación
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          name="variantCompareAtPrice"
                          value={compareAtPrice}
                          onChange={(e) => setCompareAtPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-11 pl-8 pr-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <label className="text-sm font-semibold text-dark">Estado</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between text-sm font-medium text-dark hover:border-gray-300 transition-colors">
                        <span className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500' :
                            status === 'DRAFT' ? 'bg-gray-400' : 'bg-amber-500'
                            }`} />
                          {status === 'ACTIVE' ? 'Activo' :
                            status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                        </span>
                        <ChevronDown size={14} className="text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px] bg-white rounded-xl shadow-xl border border-gray-200 p-1 mt-1">
                      <DropdownMenuItem
                        onSelect={() => setStatus('ACTIVE')}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                        {status === 'ACTIVE' && <Check size={14} className="text-brand-orange" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setStatus('DRAFT')}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          Borrador
                        </span>
                        {status === 'DRAFT' && <Check size={14} className="text-brand-orange" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setStatus('ARCHIVED')}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          Archivado
                        </span>
                        {status === 'ARCHIVED' && <Check size={14} className="text-brand-orange" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-bold text-dark flex items-center justify-between uppercase tracking-widest">
                    Organización
                  </h3>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoría / Tipo</label>
                      <input
                        name="productType"
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        placeholder="Ej: Modelos 3D"
                        className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange outline-none text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proveedor</label>
                      <input
                        name="vendor"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        placeholder="Ej: 3D Landmarks"
                        className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange outline-none text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Etiquetas</label>
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Presiona Enter para añadir"
                        className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange outline-none text-sm font-medium"
                      />
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 group hover:bg-gray-200 transition-colors"
                            >
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)}>
                                <X size={10} className="text-gray-400 group-hover:text-red-500" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <label className="text-sm font-semibold text-dark">URL amigable (Handle)</label>
                  <div>
                    <input
                      name="handle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-orange transition-all outline-none text-sm font-medium"
                    />
                    <div className="pt-2 flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                      <ExternalLink size={10} />
                      {handle || 'mi-producto'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
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
