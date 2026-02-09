import {useMemo, useState} from 'react';
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from '~/components/ui/carousel';
import {Button} from '~/components/ui/button';
import {cn} from '~/lib/utils';
import {TagChip} from '~/components/landing/TagChip';

export type BestSellerProduct = {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  featuredImage?: {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  priceRange: {
    minVariantPrice: MoneyV2;
  };
};

type FilterKey = 'descuento' | 'nuevo' | 'disponible' | null;

export function BestSellers({products}: {products: BestSellerProduct[]}) {
  const [filter, setFilter] = useState<FilterKey>(null);

  const filtered = useMemo(() => {
    if (!filter) return products;
    const tag =
      filter === 'nuevo'
        ? 'Nuevo'
        : filter === 'disponible'
          ? 'Con inventario'
          : 'Descuento';
    return products.filter((p) => p.tags?.includes(tag));
  }, [filter, products]);

  return (
    <section className="flex w-full flex-col items-center justify-between gap-10 bg-light py-20 text-dark">
      <div className="flex w-full flex-col gap-3 px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
            Productos m&aacute;s vendidos
          </h2>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter === 'descuento'}
              onClick={() => setFilter((f) => (f === 'descuento' ? null : 'descuento'))}
            >
              Descuento
            </FilterButton>
            <FilterButton active={filter === 'nuevo'} onClick={() => setFilter((f) => (f === 'nuevo' ? null : 'nuevo'))}>
              Nuevo
            </FilterButton>
            <FilterButton
              active={filter === 'disponible'}
              onClick={() => setFilter((f) => (f === 'disponible' ? null : 'disponible'))}
            >
              Disponible
            </FilterButton>
          </div>
        </div>

        <div className="border-t border-dark">
          <Carousel opts={{align: 'start', loop: false}} className="pt-6">
            <CarouselContent>
              {filtered.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[85%] pl-0 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <StoreItem product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-4 flex justify-end gap-2">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}

function FilterButton({
  active,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {active: boolean}) {
  return (
    <Button
      type="button"
      variant={active ? 'action' : 'secondary'}
      size="sm"
      className={cn(active ? '' : 'opacity-90', className)}
      {...props}
    />
  );
}

function StoreItem({product}: {product: BestSellerProduct}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-dark/10 bg-light">
      <Link
        to={`/products/${product.handle}`}
        prefetch="intent"
        className="flex flex-col gap-8 p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-extrabold uppercase leading-tight tracking-tight">
            {product.title}
          </h3>
          <p className="text-right text-sm font-semibold text-tgray">
            <Money data={product.priceRange.minVariantPrice} />
          </p>
        </div>

        <div className="relative mx-auto aspect-square w-2/3">
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              alt={product.featuredImage.altText || product.title}
              aspectRatio="1/1"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 300px, 60vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dark/10 bg-lightgray text-xs font-semibold uppercase text-tgray">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(product.tags ?? []).slice(0, 3).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      </Link>

      <div className="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
        <Button asChild variant="action" className="w-full">
          <Link to={`/products/${product.handle}`} prefetch="intent">
            Ver art&iacute;culo
          </Link>
        </Button>
      </div>
    </div>
  );
}
