import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      key={product.id}
      prefetch="intent"
      to={variantUrl}
      className="group flex flex-col gap-3 overflow-hidden rounded-lg border border-dark/10 bg-light p-4 transition-colors duration-200 hover:border-primary"
    >
      <div className="aspect-square w-full overflow-hidden rounded-md border border-dark/10 bg-lightgray">
        {image ? (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 1024px) 25vw, 80vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-tgray">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <h3 className="line-clamp-2 text-sm font-extrabold uppercase leading-tight tracking-tight text-dark">
          {product.title}
        </h3>
        <p className="text-right text-sm font-semibold text-tgray">
          <Money data={product.priceRange.minVariantPrice} />
        </p>
      </div>
    </Link>
  );
}
