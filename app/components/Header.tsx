import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {cn} from '~/lib/utils';
import {LogoIcon} from '~/components/LogoIcon';
import {Button} from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {ChevronDown, Menu, Search, ShoppingCart, User} from 'lucide-react';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

type MenuItem = NonNullable<HeaderQuery['menu']>['items'][number];

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-dark/10 bg-light/80 px-5 py-4 backdrop-blur-md">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-10 text-dark">
          <NavLink
            to="/"
            end
            prefetch="intent"
            className="flex items-center gap-2 rounded-md"
          >
            <LogoIcon className="h-12 w-12" />
            <span className="text-xl font-bold normal-case tracking-tight">
              {shop?.name || 'Translate3D'}
            </span>
          </NavLink>

          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
        </div>

        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();

  const items = (menu?.items?.length ? menu.items : FALLBACK_HEADER_MENU.items) as MenuItem[];
  const normalizeUrl = (rawUrl: string) =>
    rawUrl.includes('myshopify.com') ||
    rawUrl.includes(publicStoreDomain) ||
    rawUrl.includes(primaryDomainUrl)
      ? new URL(rawUrl).pathname
      : rawUrl;

  if (viewport === 'mobile') {
    return (
      <nav className="flex flex-col gap-2" role="navigation">
        {items.map((item) => {
          if (!item.url) return null;
          const url = normalizeUrl(item.url);
          const childItems = item.items ?? [];

          return (
            <div key={item.id} className="flex flex-col gap-1">
              <NavLink
                to={url}
                onClick={close}
                prefetch="intent"
                className={({isActive}) =>
                  cn(
                    'rounded-lg border border-dark/10 bg-light px-4 py-3 text-base font-extrabold uppercase tracking-tight text-dark',
                    isActive && 'border-primary text-primary',
                  )
                }
              >
                {item.title}
              </NavLink>

              {childItems.length ? (
                <div className="ml-3 flex flex-col gap-1 border-l border-dark/10 pl-3">
                  {childItems.map((sub) => {
                    if (!sub.url) return null;
                    const subUrl = normalizeUrl(sub.url);
                    return (
                      <NavLink
                        key={sub.id}
                        to={subUrl}
                        onClick={close}
                        prefetch="intent"
                        className={({isActive}) =>
                          cn(
                            'rounded-lg px-4 py-2 text-sm font-extrabold uppercase tracking-tight text-dark/80 hover:bg-dark hover:text-light',
                            isActive && 'text-primary',
                          )
                        }
                      >
                        {sub.title}
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="hidden items-center justify-center gap-4 font-medium uppercase md:flex" role="navigation">
      {items.map((item) => {
        if (!item.url) return null;
        const url = normalizeUrl(item.url);
        const childItems = item.items ?? [];

        if (childItems.length) {
          return (
            <DropdownMenu key={item.id}>
              <DropdownMenuTrigger asChild>
                <button className="link-dark flex items-center gap-2 rounded px-1 py-0.5 text-base uppercase transition-colors duration-300 hover:text-primary">
                  {item.title} <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {childItems.map((sub) => {
                  if (!sub.url) return null;
                  const subUrl = normalizeUrl(sub.url);
                  return (
                    <DropdownMenuItem key={sub.id} asChild>
                      <NavLink to={subUrl} prefetch="intent" onClick={close}>
                        {sub.title}
                      </NavLink>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <NavLink
            key={item.id}
            to={url}
            end
            prefetch="intent"
            className={({isActive}) =>
              cn(
                'link-dark rounded px-1 py-0.5 text-base uppercase transition-colors duration-300 hover:text-primary',
                isActive && 'text-primary',
              )
            }
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  const {open} = useAside();

  return (
    <nav className="flex items-center gap-2" role="navigation">
      <HeaderMenuMobileToggle />

      <NavLink
        to="/account"
        prefetch="intent"
        className="md:hidden"
        aria-label="Cuenta"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-dark/10 bg-light text-dark hover:bg-dark hover:text-light">
          <User className="h-4 w-4" />
        </span>
      </NavLink>

      <NavLink
        to="/account"
        prefetch="intent"
        className={({isActive}) =>
          cn(
            'hidden items-center gap-2 rounded-lg border border-dark/10 bg-light px-3 py-2 text-sm font-extrabold uppercase tracking-tight text-dark hover:bg-dark hover:text-light md:inline-flex',
            isActive && 'border-primary text-primary',
          )
        }
      >
        <User className="h-4 w-4" />
        <Suspense fallback="Cuenta">
          <Await resolve={isLoggedIn} errorElement="Cuenta">
            {(loggedIn) => (loggedIn ? 'Mi cuenta' : 'Iniciar sesi\u00f3n')}
          </Await>
        </Suspense>
      </NavLink>

      <IconButton onClick={() => open('search')} label="Buscar">
        <Search className="h-4 w-4" />
      </IconButton>

      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <IconButton onClick={() => open('mobile')} label="Men\u00fa" className="md:hidden">
      <Menu className="h-4 w-4" />
    </IconButton>
  );
}

function IconButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & {label: string}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn('rounded-lg', className)}
      aria-label={label}
      {...props}
    />
  );
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      type="button"
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-dark/10 bg-light text-dark hover:bg-dark hover:text-light"
      aria-label="Carrito"
    >
      <ShoppingCart className="h-4 w-4" />
      {count !== null ? (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-light">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'fallback-menu',
  items: [
    {
      id: 'tienda',
      resourceId: null,
      tags: [],
      title: 'Tienda',
      type: 'HTTP',
      url: '/collections',
      items: [
        {
          id: 'tienda-modelos',
          resourceId: null,
          tags: [],
          title: 'Modelos 3D',
          type: 'HTTP',
          url: '/collections/modelos-3d',
          items: [],
        },
        {
          id: 'tienda-filamentos',
          resourceId: null,
          tags: [],
          title: 'Filamentos',
          type: 'HTTP',
          url: '/collections/filamentos',
          items: [],
        },
        {
          id: 'tienda-resinas',
          resourceId: null,
          tags: [],
          title: 'Resinas',
          type: 'HTTP',
          url: '/collections/resinas',
          items: [],
        },
        {
          id: 'tienda-refacciones',
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
      id: 'servicios',
      resourceId: null,
      tags: [],
      title: 'Servicios',
      type: 'HTTP',
      url: '/servicios',
      items: [],
    },
    {
      id: 'blog',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/blog',
      items: [],
    },
    {
      id: 'sobre-nosotros',
      resourceId: null,
      tags: [],
      title: 'Sobre nosotros',
      type: 'HTTP',
      url: '/sobre-nosotros',
      items: [],
    },
  ],
};
