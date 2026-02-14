import { Link } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
} from 'storefrontapi.generated';
import { useVariantUrl } from '~/lib/variants';
import { Button } from '~/components/ui/button';
import { cn, focusStyle } from '~/lib/utils';
import { TagChip } from '~/components/landing/TagChip';

export function ProductItem({
  product,
  loading,
  collectionHandle,
}: {
  product: CollectionItemFragment | ProductItemFragment;
  loading?: 'eager' | 'lazy';
  collectionHandle?: string;
}) {
  const variantUrl = useVariantUrl(product.handle, undefined, collectionHandle);

  return (
    <div className="relative group overflow-clip h-full flex flex-col">
      <Link
        to={variantUrl}
        prefetch="intent"
        className={cn(
          "flex flex-col items-center p-4 gap-20 group relative rounded-md h-full justify-between",
          focusStyle({ theme: 'dark', focusType: 'inner' })
        )}
      >
        <div className="flex w-full justify-between items-start">
          <h3 className="text-xl font-extrabold line-clamp-2 overflow-hidden min-h-[calc(2*1.25*1em)] leading-tight uppercase">
            {product.title}
          </h3>
          <p className="text-gray-500 text-base font-normal whitespace-nowrap ml-4">
            <Money data={product.priceRange.minVariantPrice} />
          </p>
        </div>

        <div className="relative w-3/5 aspect-square">
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              alt={product.featuredImage.altText || product.title}
              aspectRatio="1/1"
              loading={loading}
              className="h-full w-full object-cover transition-all duration-300"
              sizes="(max-width: 450px) 100vw, 450px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-lightgray text-xs font-semibold uppercase text-tgray">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex w-full justify-center items-center gap-2.5">
          {((product as any).tags ?? []).slice(0, 3).map((tag: string) => (
            <TagChip
              key={tag}
              label={tag}
              availableForSale={(product as any).availableForSale}
            />
          ))}
        </div>
      </Link>

      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full transition-transform group-hover:translate-y-0 duration-300 pointer-events-none">
        <Button asChild variant="action" className="w-full pointer-events-auto" tabIndex={-1}>
          <Link to={variantUrl} prefetch="intent">
            Ver art&iacute;culo
          </Link>
        </Button>
      </div>
    </div>
  );
}
