import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      {compareAtPrice ? (
        <>
          <span className="font-extrabold text-primary">
            {price ? <Money data={price} /> : null}
          </span>
          <s className="text-xs font-semibold text-tgray">
            <Money data={compareAtPrice} />
          </s>
        </>
      ) : price ? (
        <span className="font-extrabold text-dark">
          <Money data={price} />
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
