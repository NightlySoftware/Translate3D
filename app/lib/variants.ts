import { useLocation } from 'react-router';
import type { SelectedOption } from '@shopify/hydrogen/storefront-api-types';
import { useMemo } from 'react';

export function useVariantUrl(
  handle: string,
  selectedOptions?: SelectedOption[],
  collectionHandle?: string,
) {
  const { pathname } = useLocation();

  return useMemo(() => {
    return getVariantUrl({
      handle,
      pathname,
      searchParams: new URLSearchParams(),
      selectedOptions,
      collectionHandle,
    });
  }, [handle, selectedOptions, pathname, collectionHandle]);
}

export function getVariantUrl({
  handle,
  pathname,
  searchParams,
  selectedOptions,
  collectionHandle,
}: {
  handle: string;
  pathname: string;
  searchParams: URLSearchParams;
  selectedOptions?: SelectedOption[];
  collectionHandle?: string;
}) {
  const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const isLocalePathname = match && match.length > 0;

  const prefix = collectionHandle || 'all';
  const path = isLocalePathname
    ? `${match![0]}tienda/${prefix}/${handle}`
    : `/tienda/${prefix}/${handle}`;

  selectedOptions?.forEach((option) => {
    searchParams.set(option.name, option.value);
  });

  const searchString = searchParams.toString();

  return path + (searchString ? '?' + searchParams.toString() : '');
}
