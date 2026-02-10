/**
 * Seed a Shopify store with initial Translate3D products, collections, and blog posts.
 *
 * Requirements:
 * - A Shopify store (dev store is fine)
 * - A Shopify Admin API access token from a Custom App
 *
 * Usage (from `nozzle/`):
 *   SHOPIFY_STORE_DOMAIN="your-store.myshopify.com" \
 *   SHOPIFY_ADMIN_API_ACCESS_TOKEN="shpat_..." \
 *   bun run seed:shopify
 *
 * Notes:
 * - This is intentionally minimal and not fully idempotent.
 * - Running it multiple times can create duplicates.
 */

import {readFile} from 'node:fs/promises';
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

async function readAttachment(publicRelativePath: string) {
  const filePath = path.resolve(process.cwd(), 'public', publicRelativePath);
  const buf = await readFile(filePath);
  return buf.toString('base64');
}

async function createBlog(title: string) {
  const body = {blog: {title}};
  const res = await shopifyRequest<{blog: {id: number; handle: string}}>(
    '/blogs.json',
    {method: 'POST', body: JSON.stringify(body)},
  );
  return res.blog;
}

async function createArticle(blogId: number, input: {title: string; bodyHtml: string; imageAttachment?: string}) {
  const body: Json = {
    article: {
      title: input.title,
      body_html: input.bodyHtml,
      published: true,
    },
  };

  if (input.imageAttachment) {
    body.article.image = {attachment: input.imageAttachment};
  }

  const res = await shopifyRequest<{article: {id: number; handle: string}}>(
    `/blogs/${blogId}/articles.json`,
    {method: 'POST', body: JSON.stringify(body)},
  );
  return res.article;
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
    body.custom_collection.image = {attachment: input.imageAttachment};
  }

  const res = await shopifyRequest<{custom_collection: {id: number; handle: string}}>(
    '/custom_collections.json',
    {method: 'POST', body: JSON.stringify(body)},
  );
  return res.custom_collection;
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
        ? [{attachment: input.imageAttachment}]
        : [],
    },
  };

  const res = await shopifyRequest<{product: {id: number; handle: string}}>(
    '/products.json',
    {method: 'POST', body: JSON.stringify(body)},
  );
  return res.product;
}

async function createCollect(productId: number, collectionId: number) {
  const body = {collect: {product_id: productId, collection_id: collectionId}};
  await shopifyRequest('/collects.json', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function main() {
  console.warn(`Seeding Shopify store: ${STORE_DOMAIN} (${ADMIN_API_VERSION})`);

  // Blog + articles (used by landing "Featured" section)
  try {
    const blog = await createBlog('Blog');
    console.warn(`Created blog: ${blog.handle} (${blog.id})`);

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
      const attachment = await readAttachment(a.image);
      const created = await createArticle(blog.id, {
        title: a.title,
        bodyHtml: a.bodyHtml,
        imageAttachment: attachment,
      });
      console.warn(`Created article: ${created.handle} (${created.id})`);
    }
  } catch (error) {
    // Common when the Admin token is missing merchant approval for write_content.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      [
        'Skipping blog seed (Customer-facing "Featured" will be empty until fixed).',
        'Reason:',
        message.split('\n')[0],
        '',
        'Fix: In Shopify Admin -> Apps -> Develop apps -> Your app:',
        '- Enable Admin API scopes: write_content (and write_products).',
        '- Save, then (re)install the app to get merchant approval, and paste the new shpat token into SHOPIFY_ADMIN_API_ACCESS_TOKEN.',
      ].join('\n'),
    );
  }

  // Collections (used by landing "StoreCategories" section)
  const collectionsToCreate = [
    {title: 'Modelos 3D', handle: 'modelos-3d', image: 'tienda/modelos-3d.webp'},
    {title: 'Filamentos', handle: 'filamentos', image: 'tienda/filamentos.webp'},
    {title: 'Resinas', handle: 'resinas', image: 'tienda/resinas.webp'},
    {title: 'Refacciones', handle: 'refacciones', image: 'tienda/refacciones.webp'},
    {title: 'Impresiones', handle: 'impresiones', image: 'work.webp'},
    {title: 'Best Sellers', handle: 'best-sellers', image: 'kit.webp'},
  ];

  const collectionIds = new Map<string, number>();
  for (const c of collectionsToCreate) {
    try {
      const attachment = await readAttachment(c.image);
      const created = await createCustomCollection({
        title: c.title,
        handle: c.handle,
        imageAttachment: attachment,
      });
      collectionIds.set(c.handle, created.id);
      console.warn(`Created collection: ${created.handle} (${created.id})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Skipping collection "${c.handle}" (insufficient Admin permissions?). ${message.split('\n')[0]}`,
      );
    }
  }

  // Products (ported from old mock data)
  const productsToCreate = [
    {
      title: 'Cama de vidrio Carbonuro para impresoras Creality S3',
      bodyHtml:
        '<p>Cama de vidrio premium con revestimiento de carbonuro. Excelente adhesión durante la impresión y fácil extracción de piezas una vez enfriadas.</p>',
      vendor: 'Creality Official',
      productType: 'Refacciones',
      tags: ['Nuevo', 'Con inventario', 'Tienda'],
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
      tags: ['Nuevo', 'Con inventario', 'Tienda'],
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
      tags: ['Nuevo', 'Con inventario', 'Tienda'],
      price: '600.00',
      sku: 'MOD-TE-001',
      image: 'items/model.png',
      collection: 'modelos-3d',
    },
  ];

  for (const p of productsToCreate) {
    try {
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

      console.warn(`Created product: ${created.handle} (${created.id})`);

      const collectionId = collectionIds.get(p.collection);
      if (collectionId) {
        await createCollect(created.id, collectionId);
      }

      const bestSellersId = collectionIds.get('best-sellers');
      if (bestSellersId) {
        await createCollect(created.id, bestSellersId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Skipping product "${p.title}" (insufficient Admin permissions?). ${message.split('\n')[0]}`,
      );
    }
  }

  console.warn('Done.');
}

await main();
