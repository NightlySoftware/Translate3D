# Translate3D (Shopify Headless con Hydrogen)

Este proyecto es una tienda headless en **Shopify + Hydrogen (Remix/React Router)**.

## Stack

- Shopify Hydrogen `2025.x`
- React 18
- Tailwind CSS v4 (CSS-first)
- `shadcn/ui` como base de componentes (`/app/components/ui/*`)

## Requisitos

- Node `>= 18`
- Bun (recomendado): https://bun.sh
- Shopify CLI (`shopify`) (ya viene en dependencias del proyecto)

## Desarrollo local

```bash
cd nozzle
bun install
bun run dev
```

Nota: para que la app funcione de verdad necesitas conectar una tienda de Shopify (Storefront API token).

## Conectar Shopify (Storefront API)

1. Crea una tienda (dev store funciona perfecto).
2. Enlaza Hydrogen con tu tienda:

```bash
cd nozzle
bun shopify hydrogen link
```

3. Descarga variables de entorno (si aplica en tu caso):

```bash
bun shopify hydrogen env pull
```

El dev server usa `.env` (MiniOxygen). Debes tener variables tipo `PUBLIC_STORE_DOMAIN` y `PUBLIC_STOREFRONT_API_TOKEN`.

## Seed de datos (blog + colecciones + productos)

Como no tienes data inicial en Shopify, incluimos un script para crear los datos del landing en tu tienda:

- Blog: `Blog` (handle esperado: `blog`) + 4 art\u00edculos
- Colecciones (handles):
  - `modelos-3d`
  - `filamentos`
  - `resinas`
  - `refacciones`
  - `impresiones` (puede estar vac\u00eda al inicio)
  - `best-sellers`
- Productos (del mock del repo viejo): 3 productos + im\u00e1genes + tags

### Requisitos del Admin API token

Necesitas un **Custom App** en Shopify Admin con un **Admin API access token** con scopes como:

- `write_products`
- `write_content`

### Ejecutar seed

```bash
cd nozzle
SHOPIFY_STORE_DOMAIN="tu-tienda.myshopify.com" \
SHOPIFY_ADMIN_API_ACCESS_TOKEN="shpat_..." \
bun run seed:shopify
```

Importante: el seed no es 100% idempotente; si lo ejecutas varias veces puede duplicar contenido.

## Test/Verificaci\u00f3n (real fetch)

Este script valida que la data que usa el landing exista y sea fetchable desde el **Storefront API**.

```bash
cd nozzle
PUBLIC_STORE_DOMAIN="tu-tienda.myshopify.com" \
PUBLIC_STOREFRONT_API_TOKEN="..." \
bun run test:shopify
```

Tambi\u00e9n acepta `SHOPIFY_STORE_DOMAIN` / `SHOPIFY_STOREFRONT_API_TOKEN`.

## Notas de producto

- Idioma: **espa\u00f1ol** (por ahora).
- El “order tracker” en Hero/Footer est\u00e1 intencionalmente como **dummy** (deshabilitado) para decidir provider/servicio despu\u00e9s.
- El landing usa Shopify real:
  - “Featured” = art\u00edculos de blog (`blog`)
  - Categor\u00edas = colecciones por handle
  - Best sellers = productos (Storefront API)
