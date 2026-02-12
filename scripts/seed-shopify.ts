/**
 * Seed a Shopify store with initial Translate3D products, collections, and blog posts.
 *
 * Requirements:
 * - A Shopify store (dev store is fine)
 * - A Shopify Admin API access token from a Custom App with scopes:
 *   write_content, write_products, read_content, read_products
 *
 * Usage (from `nozzle/`):
 *   SHOPIFY_STORE_DOMAIN="your-store.myshopify.com" \
 *   SHOPIFY_ADMIN_API_ACCESS_TOKEN="shpat_..." \
 *   bun run seed:shopify
 *
 * Notes:
 * - Idempotent: checks for existing resources before creating new ones.
 * - Running it multiple times is safe.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

type Json = Record<string, any>;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeDomain(domain: string) {
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

const STORE_DOMAIN = normalizeDomain(requiredEnv('SHOPIFY_STORE_DOMAIN'));
const ADMIN_TOKEN = requiredEnv('SHOPIFY_ADMIN_API_ACCESS_TOKEN');
const ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION ?? '2025-01';
const API_BASE = `https://${STORE_DOMAIN}/admin/api/${ADMIN_API_VERSION}`;

// ─── REST helpers ────────────────────────────────────────────────────────────

async function shopifyRequest<T = Json>(pathname: string, init: RequestInit) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Shopify request failed (${res.status} ${res.statusText}) ${pathname}\n${text}`,
    );
  }
  return JSON.parse(text) as T;
}

async function shopifyGet<T = Json>(pathname: string) {
  return shopifyRequest<T>(pathname, { method: 'GET' });
}

// ─── Scope check ─────────────────────────────────────────────────────────────

async function checkAdminScopes() {
  console.warn('Checking Admin API scopes...');
  try {
    // Scopes endpoint is outside the versioned API path
    const scopeRes = await fetch(
      `https://${STORE_DOMAIN}/admin/oauth/access_scopes.json`,
      { headers: { 'X-Shopify-Access-Token': ADMIN_TOKEN } },
    );
    if (!scopeRes.ok) {
      throw new Error(`HTTP ${scopeRes.status} ${scopeRes.statusText}`);
    }
    const data = (await scopeRes.json()) as { access_scopes: Array<{ handle: string }> };
    const scopes = data.access_scopes.map((s) => s.handle);
    const required = ['write_content', 'write_products'];
    const missing = required.filter((r) => !scopes.includes(r));

    if (missing.length > 0) {
      console.error(
        [
          `\n❌ Admin API token is missing required scopes: ${missing.join(', ')}`,
          '',
          'Current scopes:',
          scopes.map((s) => `  - ${s}`).join('\n'),
          '',
          'Fix: In Shopify Admin → Settings → Apps → Develop apps → your app:',
          '  1. Click "Configure Admin API scopes"',
          `  2. Enable: ${missing.join(', ')}`,
          '  3. Save → Install/Reinstall app',
          '  4. Copy new shpat_... token into .env SHOPIFY_ADMIN_API_ACCESS_TOKEN',
          '',
        ].join('\n'),
      );
      process.exit(1);
    }
    console.warn(`  ✓ All required scopes present (${required.join(', ')})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to check scopes: ${message}`);
    process.exit(1);
  }
}

// ─── Image helper ────────────────────────────────────────────────────────────

async function readAttachment(publicRelativePath: string) {
  const filePath = path.resolve(process.cwd(), 'public', publicRelativePath);
  const buf = await readFile(filePath);
  return buf.toString('base64');
}

// ─── Blog ────────────────────────────────────────────────────────────────────

async function findBlogByHandle(handle: string) {
  try {
    const data = await shopifyGet<{ blogs: Array<{ id: number; handle: string }> }>(
      `/blogs.json?handle=${handle}`,
    );
    return data.blogs?.[0] ?? null;
  } catch {
    return null;
  }
}

async function createBlog(title: string) {
  const body = { blog: { title } };
  const res = await shopifyRequest<{ blog: { id: number; handle: string } }>(
    '/blogs.json',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.blog;
}

async function getOrCreateBlog(title: string, handle: string) {
  const existing = await findBlogByHandle(handle);
  if (existing) {
    console.warn(`  ↳ Blog already exists: ${existing.handle} (${existing.id})`);
    return existing;
  }
  const blog = await createBlog(title);
  console.warn(`  ✓ Created blog: ${blog.handle} (${blog.id})`);
  return blog;
}

// ─── Articles ────────────────────────────────────────────────────────────────

async function getBlogArticles(blogId: number) {
  try {
    const data = await shopifyGet<{ articles: Array<{ id: number; title: string; handle: string }> }>(
      `/blogs/${blogId}/articles.json?limit=250`,
    );
    return data.articles ?? [];
  } catch {
    return [];
  }
}

async function createArticle(
  blogId: number,
  input: { title: string; bodyHtml: string; imageAttachment?: string },
) {
  const body: Json = {
    article: {
      title: input.title,
      body_html: input.bodyHtml,
      published: true,
    },
  };
  if (input.imageAttachment) {
    body.article.image = { attachment: input.imageAttachment };
  }
  const res = await shopifyRequest<{ article: { id: number; handle: string } }>(
    `/blogs/${blogId}/articles.json`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.article;
}

// ─── Collections ─────────────────────────────────────────────────────────────

async function findCollectionByHandle(handle: string) {
  try {
    const data = await shopifyGet<{
      custom_collections: Array<{ id: number; handle: string; title: string }>;
    }>(`/custom_collections.json?handle=${handle}`);
    return data.custom_collections?.[0] ?? null;
  } catch {
    return null;
  }
}

async function createCustomCollection(input: {
  title: string;
  handle: string;
  imageAttachment?: string;
}) {
  const body: Json = {
    custom_collection: {
      title: input.title,
      handle: input.handle,
      published: true,
    },
  };
  if (input.imageAttachment) {
    body.custom_collection.image = { attachment: input.imageAttachment };
  }
  const res = await shopifyRequest<{ custom_collection: { id: number; handle: string } }>(
    '/custom_collections.json',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.custom_collection;
}

async function getOrCreateCollection(input: {
  title: string;
  handle: string;
  image: string;
}) {
  const existing = await findCollectionByHandle(input.handle);
  if (existing) {
    console.warn(`  ↳ Collection already exists: ${existing.handle} (${existing.id})`);
    return existing;
  }
  const attachment = await readAttachment(input.image);
  const created = await createCustomCollection({
    title: input.title,
    handle: input.handle,
    imageAttachment: attachment,
  });
  console.warn(`  ✓ Created collection: ${created.handle} (${created.id})`);
  return created;
}

// ─── Products ────────────────────────────────────────────────────────────────

async function findProductByTitle(title: string) {
  try {
    const data = await shopifyGet<{
      products: Array<{ id: number; handle: string; title: string }>;
    }>(`/products.json?title=${encodeURIComponent(title)}&limit=5`);
    return data.products?.find((p) => p.title === title) ?? null;
  } catch {
    return null;
  }
}

async function createProduct(input: {
  title: string;
  bodyHtml: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  price: string;
  sku?: string;
  imageAttachment?: string;
}) {
  const body: Json = {
    product: {
      title: input.title,
      body_html: input.bodyHtml,
      vendor: input.vendor,
      product_type: input.productType,
      tags: input.tags?.join(', '),
      published: true,
      variants: [
        {
          price: input.price,
          sku: input.sku,
        },
      ],
      images: input.imageAttachment
        ? [{ attachment: input.imageAttachment }]
        : [],
    },
  };

  const res = await shopifyRequest<{ product: { id: number; handle: string } }>(
    '/products.json',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.product;
}

async function createCollect(productId: number, collectionId: number) {
  const body = { collect: { product_id: productId, collection_id: collectionId } };
  await shopifyRequest('/collects.json', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.warn(`\n🔧 Seeding Shopify store: ${STORE_DOMAIN} (API ${ADMIN_API_VERSION})\n`);

  await checkAdminScopes();

  // ── Blog + articles ──
  console.warn('\n📝 Blog & articles...');
  const blog = await getOrCreateBlog('Blog', 'blog');

  const existingArticles = await getBlogArticles(blog.id);
  const existingTitles = new Set(existingArticles.map((a) => a.title));

  const articles = [
    {
      title: 'La impresión 3D en la medicina',
      bodyHtml:
        '<p>La impresión 3D está transformando la medicina: prótesis personalizadas, modelos anatómicos para planificación quirúrgica y más.</p>',
      image: 'enterprise.webp',
    },
    {
      title: 'Cambios de filamento: mejores prácticas',
      bodyHtml:
        '<p>Cómo cambiar filamento sin atascos, evitando oozing, y manteniendo consistencia en color y temperatura.</p>',
      image: 'design.webp',
    },
    {
      title: 'Resinas: guía rápida de seguridad y curado',
      bodyHtml:
        '<p>Consejos para manejar resinas con seguridad, lavado, curado UV y almacenamiento.</p>',
      image: 'tienda/resinas.webp',
    },
    {
      title: 'Mantenimiento básico de tu impresora 3D',
      bodyHtml:
        '<p>Checklist semanal: limpieza, nivelación, lubricación de ejes y revisión de boquilla.</p>',
      image: 'work.webp',
    },
  ];

  for (const a of articles) {
    if (existingTitles.has(a.title)) {
      console.warn(`  ↳ Article already exists: "${a.title}"`);
      continue;
    }
    const attachment = await readAttachment(a.image);
    const created = await createArticle(blog.id, {
      title: a.title,
      bodyHtml: a.bodyHtml,
      imageAttachment: attachment,
    });
    console.warn(`  ✓ Created article: ${created.handle} (${created.id})`);
  }

  // ── Collections ──
  console.warn('\n📦 Collections...');
  const collectionsToCreate = [
    { title: 'Modelos 3D', handle: 'modelos-3d', image: 'tienda/modelos-3d.webp' },
    { title: 'Filamentos', handle: 'filamentos', image: 'tienda/filamentos.webp' },
    { title: 'Resinas', handle: 'resinas', image: 'tienda/resinas.webp' },
    { title: 'Refacciones', handle: 'refacciones', image: 'tienda/refacciones.webp' },
    { title: 'Impresiones', handle: 'impresiones', image: 'work.webp' },
    { title: 'Best Sellers', handle: 'best-sellers', image: 'kit.webp' },
  ];

  const collectionIds = new Map<string, number>();
  for (const c of collectionsToCreate) {
    const result = await getOrCreateCollection(c);
    collectionIds.set(c.handle, result.id);
  }

  // ── Products ──
  console.warn('\n🛍️  Products...');
  const productsToCreate = [
    {
      title: 'Cama de vidrio Carbonuro para impresoras Creality S3',
      bodyHtml:
        '<p>Cama de vidrio premium con revestimiento de carbonuro. Excelente adhesión durante la impresión y fácil extracción de piezas una vez enfriadas.</p>',
      vendor: 'Creality Official',
      productType: 'Refacciones',
      tags: ['Nuevo', 'Con Inventario', 'Tienda'],
      price: '600.00',
      sku: 'SPARE-BED-001',
      image: 'items/bed.png',
      collection: 'refacciones',
    },
    {
      title: 'Resina Dental Model Green 1L',
      bodyHtml:
        '<p>Resina fotopolimérica profesional para modelos dentales. Alta precisión, excelente detalle y acabado suave. Compatible con la mayoría de impresoras LCD/DLP.</p>',
      vendor: 'Dental Resins Pro',
      productType: 'Resinas',
      tags: ['Nuevo', 'Con Inventario', 'Tienda'],
      price: '600.00',
      sku: 'MAT-RES-001',
      image: 'items/resin.png',
      collection: 'resinas',
    },
    {
      title: 'Torre Eiffel',
      bodyHtml:
        '<p>Modelo 3D detallado de la icónica Torre Eiffel, optimizado para impresión 3D. Incluye guía de impresión recomendada.</p>',
      vendor: '3D Landmarks',
      productType: 'Modelos 3D',
      tags: ['Nuevo', 'Con Inventario', 'Tienda'],
      price: '600.00',
      sku: 'MOD-TE-001',
      image: 'items/model.png',
      collection: 'modelos-3d',
    },
  ];

  for (const p of productsToCreate) {
    const existing = await findProductByTitle(p.title);
    if (existing) {
      console.warn(`  ↳ Product already exists: "${p.title}" (${existing.id})`);
      // Still ensure it's in the right collections
      const collectionId = collectionIds.get(p.collection);
      if (collectionId) {
        try {
          await createCollect(existing.id, collectionId);
        } catch {
          // Already in collection — that's fine
        }
      }
      const bestSellersId = collectionIds.get('best-sellers');
      if (bestSellersId) {
        try {
          await createCollect(existing.id, bestSellersId);
        } catch {
          // Already in collection — that's fine
        }
      }
      continue;
    }

    const attachment = await readAttachment(p.image);
    const created = await createProduct({
      title: p.title,
      bodyHtml: p.bodyHtml,
      vendor: p.vendor,
      productType: p.productType,
      tags: p.tags,
      price: p.price,
      sku: p.sku,
      imageAttachment: attachment,
    });
    console.warn(`  ✓ Created product: ${created.handle} (${created.id})`);

    const collectionId = collectionIds.get(p.collection);
    if (collectionId) {
      await createCollect(created.id, collectionId);
    }

    const bestSellersId = collectionIds.get('best-sellers');
    if (bestSellersId) {
      await createCollect(created.id, bestSellersId);
    }
  }

  console.warn('\n✅ Done! Next steps:');
  console.warn('  1. Run: bun run test:shopify');
  console.warn('  2. Start dev: bun run dev --port 3000');
  console.warn('  3. Open http://localhost:3000 and verify data shows up\n');
}

await main();
