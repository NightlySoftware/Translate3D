import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {Button} from '~/components/ui/button';
import {SectionSeparator} from '~/components/SectionSeparator';
import {ArrowDown, Facebook, Instagram, Youtube} from 'lucide-react';
import {cn} from '~/lib/utils';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

type FooterMenuItem = NonNullable<FooterQuery['menu']>['items'][number];

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense fallback={<div className="h-32 bg-dark" />}>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="mt-10 bg-dark text-light">
            <SectionSeparator color="dark" />
            <FooterHero />
            <FooterTracker />
            <FooterLinks
              menu={footer?.menu ?? null}
              primaryDomainUrl={header.shop.primaryDomain.url}
              publicStoreDomain={publicStoreDomain}
            />
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

function FooterHero() {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-8 px-5 py-10 lg:flex-row lg:items-center lg:px-20">
      <p className="text-[clamp(3rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-tight">
        De tu cabeza
        <br />a tu mesa
      </p>
      <img
        src="/work.webp"
        alt="Trabajo en Translate3D"
        className="w-full max-w-[520px] rounded-lg object-cover"
        loading="lazy"
      />
    </div>
  );
}

function FooterTracker() {
  return (
    <div className="px-5 pb-10">
      {/* Order tracker (dummy for now) */}
      <div className="flex w-full flex-col gap-8 rounded-2xl bg-primary p-5">
        <div className="flex items-start justify-between gap-8">
          <p className="text-[10px] font-normal leading-[1.05] tracking-wide">
            <span className="mr-10 inline-block">RASTREADOR</span>
            <span className="mr-10 inline-block">
              &iquest;YA
              <br /> HAS COMPRADO
              <br /> CON NOSOTROS?
            </span>
            <span className="inline-block">
              BUSCA
              <br /> R&Aacute;PIDAMENTE EL
              <br /> ESTATUS DE TU PEDIDO
            </span>
            <span className="ml-4 inline-block rounded-full bg-light/15 px-2 py-1 text-[10px] font-extrabold uppercase">
              Pr&oacute;ximamente
            </span>
          </p>
          <ArrowDown className="h-4 w-4 text-light" />
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: wire to real tracking provider/service.
          }}
        >
          <div className="flex w-full items-end justify-between gap-4">
            <input
              disabled
              type="text"
              placeholder="N&uacute;mero de pedido"
              className="w-full bg-transparent text-[clamp(1.75rem,5vw,4rem)] uppercase tracking-tight text-light placeholder:text-light/60 focus:outline-none disabled:opacity-70"
            />
            <Button
              disabled
              type="submit"
              variant="secondary"
              className="h-auto bg-light/10 px-6 py-4 text-[clamp(1.25rem,3vw,2.25rem)] text-light hover:bg-light/15 hover:text-light"
            >
              Buscar
            </Button>
          </div>
          <div className="h-3 w-full rounded bg-light" />
        </form>
      </div>
    </div>
  );
}

function FooterLinks({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'] | null;
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  const items = (menu?.items?.length ? menu.items : FALLBACK_FOOTER_MENU.items) as FooterMenuItem[];

  const normalizeUrl = (rawUrl: string) =>
    rawUrl.includes('myshopify.com') ||
    rawUrl.includes(publicStoreDomain) ||
    rawUrl.includes(primaryDomainUrl)
      ? new URL(rawUrl).pathname
      : rawUrl;

  const columns = items.map((item) => ({
    title: item.title,
    url: item.url ? normalizeUrl(item.url) : null,
    children: (item.items ?? []).filter((c) => c.url) as FooterMenuItem[],
  }));

  return (
    <div className="px-5 pb-10 lg:px-10">
      <div className="grid grid-cols-1 gap-8 border-b border-light/20 py-10 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <p className="text-lg font-extrabold uppercase tracking-tight">
              {col.title}
            </p>

            {col.children.length ? (
              <div className="flex flex-col gap-2">
                {col.children.map((child) => {
                  if (!child.url) return null;
                  const url = normalizeUrl(child.url);
                  const isExternal = !url.startsWith('/');
                  return isExternal ? (
                    <a
                      key={child.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-light w-fit text-sm font-normal normal-case text-light/80 hover:text-light"
                    >
                      {child.title}
                    </a>
                  ) : (
                    <Link
                      key={child.id}
                      to={url}
                      prefetch="intent"
                      className="link-light w-fit text-sm font-normal normal-case text-light/80 hover:text-light"
                    >
                      {child.title}
                    </Link>
                  );
                })}
              </div>
            ) : col.url ? (
              <Link
                to={col.url}
                prefetch="intent"
                className="link-light w-fit text-sm font-normal normal-case text-light/80 hover:text-light"
              >
                Ver
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-extrabold uppercase tracking-tight">
            Nuestras redes oficiales
          </p>
          <div className="flex items-center gap-3 text-light">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link-light"
              aria-label="Facebook"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link-light"
              aria-label="Instagram"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link-light"
              aria-label="YouTube"
            >
              <Youtube className="h-6 w-6" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-lg font-extrabold uppercase tracking-tight">
            Descubre nuestros productos
          </p>
          <Button asChild variant="secondary" className="w-fit">
            <Link to="/collections" prefetch="intent">
              Ver tienda
            </Link>
          </Button>
        </div>

        <div className="text-sm font-normal normal-case text-light/70">
          <a
            href="https://nightly.software"
            target="_blank"
            rel="noopener noreferrer"
            className={cn('link-light')}
          >
            Website by Nightly Software
          </a>
        </div>
      </div>
    </div>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'fallback-footer-menu',
  items: [
    {
      id: 'footer-tienda',
      resourceId: null,
      tags: [],
      title: 'Tienda',
      type: 'HTTP',
      url: '/collections',
      items: [
        {
          id: 'footer-modelos',
          resourceId: null,
          tags: [],
          title: 'Modelos 3D',
          type: 'HTTP',
          url: '/collections/modelos-3d',
          items: [],
        },
        {
          id: 'footer-filamentos',
          resourceId: null,
          tags: [],
          title: 'Filamentos',
          type: 'HTTP',
          url: '/collections/filamentos',
          items: [],
        },
        {
          id: 'footer-resinas',
          resourceId: null,
          tags: [],
          title: 'Resinas',
          type: 'HTTP',
          url: '/collections/resinas',
          items: [],
        },
        {
          id: 'footer-refacciones',
          resourceId: null,
          tags: [],
          title: 'Refacciones',
          type: 'HTTP',
          url: '/collections/refacciones',
          items: [],
        },
      ],
    },
    {
      id: 'footer-blog',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/blog',
      items: [
        {
          id: 'footer-blog-1',
          resourceId: null,
          tags: [],
          title: 'La impresi\u00f3n 3D en la medicina',
          type: 'HTTP',
          url: '/blogs/blog',
          items: [],
        },
        {
          id: 'footer-blog-2',
          resourceId: null,
          tags: [],
          title: 'Cambios de filamento',
          type: 'HTTP',
          url: '/blogs/blog',
          items: [],
        },
        {
          id: 'footer-blog-3',
          resourceId: null,
          tags: [],
          title: 'Mantenimiento',
          type: 'HTTP',
          url: '/blogs/blog',
          items: [],
        },
      ],
    },
    {
      id: 'footer-nosotros',
      resourceId: null,
      tags: [],
      title: 'Nosotros',
      type: 'HTTP',
      url: '/sobre-nosotros',
      items: [
        {
          id: 'footer-nosotros-1',
          resourceId: null,
          tags: [],
          title: 'Nuestra historia',
          type: 'HTTP',
          url: '/sobre-nosotros',
          items: [],
        },
        {
          id: 'footer-nosotros-2',
          resourceId: null,
          tags: [],
          title: 'Nuestro compromiso',
          type: 'HTTP',
          url: '/sobre-nosotros',
          items: [],
        },
      ],
    },
    {
      id: 'footer-soporte',
      resourceId: null,
      tags: [],
      title: 'Soporte',
      type: 'HTTP',
      url: '/soporte',
      items: [
        {
          id: 'footer-soporte-1',
          resourceId: null,
          tags: [],
          title: 'Opciones de contacto',
          type: 'HTTP',
          url: '/soporte',
          items: [],
        },
        {
          id: 'footer-soporte-2',
          resourceId: null,
          tags: [],
          title: 'Proceso de env\u00edos',
          type: 'HTTP',
          url: '/soporte',
          items: [],
        },
        {
          id: 'footer-soporte-3',
          resourceId: null,
          tags: [],
          title: 'Devoluciones',
          type: 'HTTP',
          url: '/soporte',
          items: [],
        },
      ],
    },
  ],
};
